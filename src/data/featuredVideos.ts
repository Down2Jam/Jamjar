export interface FeaturedVideo {
  url: string;
  title?: string;
}

// Videos listed here always appear before trailers pulled from game pages.
export const featuredVideos: FeaturedVideo[] = [
  {
    url: "https://www.youtube.com/watch?v=MPMFWFSvN9E",
    title: "5 DEVS Make a GAME without COMMUNICATION in 3 Days!",
  },
];
