type FontOptions = {
  subsets?: string[];
  variable?: string;
  display?: string;
};

function font(_options?: FontOptions) {
  return {
    className: "",
    style: {},
    variable: "",
  };
}

export const Inter = font;
