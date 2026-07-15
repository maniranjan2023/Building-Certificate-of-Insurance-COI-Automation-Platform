/**
 * Soft transition when swapping page segments inside the shared workspace shell.
 * Keeps the sidebar stable while content refreshes with route skeletons.
 */
export default function WorkspaceTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="animate-in fade-in duration-200 fill-mode-both">
      {children}
    </div>
  );
}