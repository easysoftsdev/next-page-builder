import type { BuilderComponent } from "../../../types/builder";
import { RenderButton } from "./Button";
import { RenderGallery } from "./Gallery";
import { RenderImage } from "./Image";
import { RenderSpacer } from "./Spacer";
import { RenderText } from "./Text";

export function ComponentRenderer({ component }: { component: BuilderComponent }) {
  switch (component.type) {
    case "text":
      return <RenderText props={component.props} />;
    case "button":
      return <RenderButton props={component.props} />;
    case "image":
      return <RenderImage props={component.props} />;
    case "gallery":
      return <RenderGallery props={component.props} />;
    case "spacer":
      return <RenderSpacer props={component.props} />;
    default:
      return null;
  }
}
