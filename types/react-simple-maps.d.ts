declare module "react-simple-maps" {
  import { ComponentProps, ReactNode, SVGProps } from "react";

  type Coordinates = [number, number];

  interface ProjectionConfig {
    center?: Coordinates;
    scale?: number;
    rotate?: Coordinates | [number, number, number];
    parallels?: [number, number];
  }

  interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    children?: ReactNode;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: Geography[] }) => ReactNode;
  }

  interface Geography {
    rsmKey: string;
    properties: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface GeographyStyle {
    default?: Record<string, unknown>;
    hover?: Record<string, unknown>;
    pressed?: Record<string, unknown>;
  }

  interface GeographyProps extends Omit<SVGProps<SVGPathElement>, "style"> {
    geography: Geography;
    tabIndex?: number;
    style?: GeographyStyle;
  }

  interface MarkerProps extends SVGProps<SVGGElement> {
    coordinates: Coordinates;
    children?: ReactNode;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
  export function ZoomableGroup(props: Record<string, unknown>): JSX.Element;
  export function Sphere(props: Record<string, unknown>): JSX.Element;
  export function Graticule(props: Record<string, unknown>): JSX.Element;
}
