export function RenderButton({ props }: { props: Record<string, unknown> }) {
  const label = typeof props.label === "string" ? props.label : "Button";
  const href = typeof props.href === "string" ? props.href : "#";
  return (
    <a className="renderer-button" href={href}>
      {label}
    </a>
  );
}
