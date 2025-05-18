import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const guidelineBaseWidth = 393;
const guidelineBaseHeight = 852;

const moderateScale = (size: number, factor = 0.5) =>
  size + (horizontalScale(size) - size) * factor;
const horizontalScale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

export { horizontalScale, verticalScale, moderateScale };
