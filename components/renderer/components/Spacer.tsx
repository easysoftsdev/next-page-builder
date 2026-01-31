export function RenderSpacer({ props }: { props: Record<string, unknown> }) {
  const height = typeof props.height === "number" ? props.height : 24;
  return <div style={{ height }} />;
}
