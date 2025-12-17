import { uploadToClouduinary } from "../lib/cloudinary.js"; 
import Status from "../models/status.model.js"; 
import response from "../lib/responeHandler.js"; 

export const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.user._id;
    const file = req.file;

    let mediaUrl = null;
    let finalContentType = contentType || "text";

    if (file) {
      const uploadFile = await uploadToClouduinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Faild to Upload file");
      }
      mediaUrl = uploadFile.secure_url;

      if (file.mimetype.startswith("video")) {
        finalContentType = "video";
      } else if (file.mimetype.startswith("image")) {
        finalContentType = "image";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content.trim()) {
      finalContentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    const expiresAt = new Date();

    expiresAt.setHours(expiresAt.getHours() + 24);

    const status = new Status({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType || "text",
      expiresAt: expiresAt,
    });

    await status.save();

    const populateStatus = await Status.findById(status._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    //emit Sockets
    if (req.io && req.socketUserMap) {
      //Brodcast the created status to other user except creator
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("new_status", populateStatus);
        }
      }
    }

    return response(res, 201, "Status crated successfully", populateStatus);
  } catch (error) {
    console.log("Error on createStatus controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};

export const getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: -1 });

    return response(res, 200, "status retrived", statuses);
  } catch (error) {
    console.log("Error on getStatuses controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};

export const viewStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);

    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId);

      await status.save();

      const updateStatus = await Status.findById(statusId)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture");

      //emit Sockets

      if (req.io && req.socketUserMap) {
        const statusOwnerSocketId = req.socketUserMap.get(
          status.user._id.toString()
        );

        if (statusOwnerSocketId) {
          const viewData = {
            statusId,
            viewerId: userId,
            totalViewers: updateStatus.viewers.length,
            viewers: updateStatus.length,
          };

          req.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
        } else {
          console.log("Status Owner is not connected");
        }
      }
    } else {
      console.log("User is aldrey viewed status");
    }

    return response(res, 200, "status viewed successfully");
  } catch (error) {
    console.log("Error on viewStatus controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);

    if (!status) {
      return response(res, 404, "status not found");
    }
    if (status.user._id.toString() !== userId) {
      return response(res, 403, "your not authorized to delete this status");
    }
    await status.deleteOne();

    //emit socket

    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId);
        }
      }
    }

    return res.status(res, 201, "status deleted successfully");
  } catch (error) {
    console.log("Error on viewStatus controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};
