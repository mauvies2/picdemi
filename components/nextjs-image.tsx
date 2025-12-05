import Image from "next/image";
import {
  isImageFitCover,
  isImageSlide,
  type Slide,
  useLightboxProps,
  useLightboxState,
} from "yet-another-react-lightbox";

function isNextJsImage(slide: Slide) {
  return (
    isImageSlide(slide) &&
    typeof slide.width === "number" &&
    typeof slide.height === "number"
  );
}

export default function NextJsImage({
  slide,
  offset,
  rect,
}: {
  slide: Slide;
  offset: number;
  rect: { width: number; height: number };
}) {
  const {
    on: { click },
    carousel: { imageFit },
  } = useLightboxProps();

  const { currentIndex } = useLightboxState();

  const cover = isImageSlide(slide) && isImageFitCover(slide, imageFit);

  if (!isNextJsImage(slide)) return undefined;

  const width = !cover
    ? Math.round(
        Math.min(
          rect.width,
          (rect.height / (slide.height ?? 0)) * (slide.width ?? 0),
        ),
      )
    : rect.width;

  const height = !cover
    ? Math.round(
        Math.min(
          rect.height,
          (rect.width / (slide.width ?? 0)) * (slide.height ?? 0),
        ),
      )
    : rect.height;

  return (
    <div style={{ position: "relative", width, height }}>
      <Image
        fill
        alt=""
        src={slide.src}
        loading="eager"
        draggable={false}
        width={slide.width ?? 0}
        height={slide.height ?? 0}
        style={{
          objectFit: cover ? "cover" : "contain",
          cursor: click ? "pointer" : undefined,
        }}
        sizes={`${Math.ceil((width / window.innerWidth) * 100)}vw`}
        onClick={
          offset === 0 ? () => click?.({ index: currentIndex }) : undefined
        }
      />
    </div>
  );
}
