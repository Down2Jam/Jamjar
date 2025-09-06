import fs from "fs";
import BuddyClient from "./BuddyClient";

const tooltips = fs
  .readdirSync("./public/sounds")
  .map((tooltip) => tooltip.split(".")[0]);

export default function Buddy() {
  return <BuddyClient tooltips={tooltips} />;
}
