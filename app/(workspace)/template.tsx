/**
 * Soft transition when swapping page segments inside the shared workspace shell.
 * Visual loading polish is handled by WorkspacePageTransition in the shell.
 */
export default function WorkspaceTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-w-0">{children}</div>;
}
