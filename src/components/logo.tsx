import * as React from "react";

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={32}
    height={32}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width={32} height={32} rx={8} fill="currentColor" className="text-primary" />
    <path
      d="M10 13L22 13"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary-foreground"
    />
    <path
      d="M18 9L22 13L18 17"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary-foreground"
    />
    <path
      d="M22 19L10 19"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary-foreground"
    />
    <path
      d="M14 23L10 19L14 15"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary-foreground"
    />
  </svg>
);

export default Logo;
