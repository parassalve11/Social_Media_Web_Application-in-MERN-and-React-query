import { SidebarProvider, useSidebar } from "./context";
import { BetterSidebar } from "./index";

const SidebarLayout = ({
  children,
  menuItems,
  logo,
  footer,
  className,
  ...props
}) => {
  const ContentWithSidebar = ({ children }) => {
    const { isOpen, width, isMobile } = useSidebar();
    const marginLeft = isMobile ? 0 : isOpen ? width : 56;

    return (
      <div className="flex w-screen">
        <BetterSidebar
          menuItems={menuItems}
          logo={logo}
          footer={footer}
          className={`shadow-md ${className}`}
          {...props}
        />
        <main
          className="flex-1 p-8 overflow-y-auto bg-white"
          style={{ marginLeft: `${marginLeft}px` }}
        >
          {children}
        </main>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <ContentWithSidebar>{children}</ContentWithSidebar>
    </SidebarProvider>
  );
};

export default SidebarLayout;