import { useTheme } from "@material-ui/core";
import { useMeeting } from "@videosdk.live/react-sdk";
import React, { useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import { useMeetingAppContext } from "../../MeetingAppContextDef";
import { meetingLayouts } from "../../MeetingAppContextDef";
import {
  calcQuality,
  getGridForMainParticipants,
  getGridRowsAndColumns,
  localAndPinnedOnTop,
} from "../../utils/common";
import useIsLGDesktop from "../../utils/useIsLGDesktop";
import useIsMobile from "../../utils/useIsMobile";
import useIsSMDesktop from "../../utils/useIsSMDesktop";
import useIsTab from "../../utils/useIsTab";
import useResponsiveSize from "../../utils/useResponsiveSize";
import { MemoizedMotionParticipant } from "../mainViewContainer/MainViewContainer";
import ParticipantViewer from "../mainViewContainer/ParticipantViewer";
import PresenterView from "../mainViewContainer/PresenterView";
import WhiteboardContainer, {
  convertHWAspectRatio,
} from "../../components/whiteboard/WhiteboardContainer";

const PinnedLayoutViewContainer = ({
  height,
  width,
  whiteboardToolbarWidth,
  whiteboardSpacing,
}) => {
  const {
    meetingLayout,
    sideBarMode,
    whiteboardStarted,
    animationsEnabled,
    hideLocalParticipant,
    reduceEdgeSpacing,
  } = useMeetingAppContext();

  const mMeeting = useMeeting();
  const localParticipantId = mMeeting?.localParticipant?.id;
  const presenterId = mMeeting?.presenterId;
  const pinnedParticipants = mMeeting?.pinnedParticipants;

  const isMobile = useIsMobile();
  const isTab = useIsTab();
  const isSMDesktop = useIsSMDesktop();
  const isLGDesktop = useIsLGDesktop();
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });
  const mobilePortrait = isMobile && isPortrait;

  const {
    spotlightParticipantId,
    sideBarPinnedParticipantIds,
    spotlightMediaType,
    singleRow,
  } = useMemo(() => {
    const pinnedParticipantIds = [...pinnedParticipants.keys()];

    const pinnedPresenter =
      pinnedParticipantIds.findIndex((id) => id === presenterId) !== -1;

    let obj;

    if (pinnedPresenter) {
      obj = {
        spotlightParticipantId: presenterId,
        sideBarPinnedParticipantIds:
          meetingLayout === meetingLayouts.SPOTLIGHT
            ? []
            : pinnedParticipantIds,
        spotlightMediaType: "SHARE",
      };
    } else if (whiteboardStarted) {
      if (meetingLayout === meetingLayouts.SPOTLIGHT) {
        obj = {
          spotlightParticipantId: "white-board-id",
          sideBarPinnedParticipantIds: [],
          spotlightMediaType: "WHITEBOARD",
        };
      } else {
        obj = {
          spotlightParticipantId: "white-board-id",
          sideBarPinnedParticipantIds: pinnedParticipantIds,
          spotlightMediaType: "WHITEBOARD",
        };
      }
    } else {
      if (meetingLayout === meetingLayouts.SPOTLIGHT) {
        obj = {
          spotlightParticipantId: null,
          sideBarPinnedParticipantIds: pinnedParticipantIds,
          spotlightMediaType: null,
        };
      } else {
        const spotlightParticipantId = pinnedParticipantIds[0];
        pinnedParticipantIds.splice(0, 1);

        obj = {
          spotlightParticipantId: spotlightParticipantId,
          sideBarPinnedParticipantIds: pinnedParticipantIds,
          spotlightMediaType: "WEBCAM",
        };
      }
    }

    if (mobilePortrait && meetingLayout === meetingLayouts.SIDEBAR) {
      const splicesActiveParticipants = obj[
        "sideBarPinnedParticipantIds"
      ].splice(0, 4);

      obj["sideBarPinnedParticipantIds"] = splicesActiveParticipants;
    }

    const participantsCount = obj.sideBarPinnedParticipantIds?.length;

    if (participantsCount) {
      const pinnedParticipantsMap = new Map(pinnedParticipants);

      if (obj["spotlightMediaType"] === "WEBCAM") {
        if (obj["spotlightParticipantId"]) {
          pinnedParticipantsMap.delete(obj["spotlightParticipantId"]);
        }
      }

      const gridInfo = getGridRowsAndColumns({
        participantsCount,
        isMobile:
          mobilePortrait && meetingLayout === meetingLayouts.SIDEBAR
            ? false
            : isMobile,
        isTab:
          mobilePortrait && meetingLayout === meetingLayouts.SIDEBAR
            ? false
            : isTab,
        isSMDesktop:
          mobilePortrait && meetingLayout === meetingLayouts.SIDEBAR
            ? false
            : isSMDesktop,
        isLGDesktop:
          mobilePortrait && meetingLayout === meetingLayouts.SIDEBAR
            ? true
            : isLGDesktop,
        isLandscape:
          mobilePortrait && meetingLayout === meetingLayouts.SIDEBAR
            ? true
            : !isPortrait,
        isPresenting:
          mobilePortrait && meetingLayout === meetingLayouts.SIDEBAR
            ? false
            : !!obj.spotlightParticipantId,
      });

      const { singleRow } = getGridForMainParticipants({
        participants: localAndPinnedOnTop({
          localParticipantId,
          participants: [...obj.sideBarPinnedParticipantIds],
          pinnedParticipantIds: [...pinnedParticipantsMap.keys()],
          moveLocalUnpinnedOnTop: false,
        }),
        gridInfo,
      });

      obj["singleRow"] = singleRow;
    } else {
      obj["singleRow"] = [];
    }

    return obj;
  }, [
    mobilePortrait,
    pinnedParticipants,
    meetingLayout,
    presenterId,
    localParticipantId,
    isMobile,
    isTab,
    isSMDesktop,
    isLGDesktop,
    isPortrait,
    whiteboardStarted,
    hideLocalParticipant,
  ]);

  const theme = useTheme();

  const rowSpacing = useResponsiveSize({
    xl: 24,
    lg: 16,
    md: 14,
    sm: 12,
    xs: 8,
  });

  const gutter = 4;
  const spacing = (reduceEdgeSpacing ? 4 : rowSpacing) - gutter;

  const presentingSideBarWidth = useResponsiveSize({
    xl: 320,
    lg: 280,
    md: 260,
    sm: 240,
    xs: 200,
  });

  const mainContainerHorizontalPadding =
    spotlightParticipantId && singleRow.length !== 0
      ? 0
      : typeof sideBarMode === "string"
      ? 0
      : sideBarPinnedParticipantIds?.length <= 9
      ? isLGDesktop
        ? singleRow.length === 2
          ? 0
          : 140
        : isSMDesktop
        ? singleRow.length === 2
          ? 20
          : 90
        : isTab && !isPortrait
        ? 60
        : 0
      : 0;

  const gridVerticalSpacing = useResponsiveSize({
    xl: 160,
    lg: 90,
    md: 90,
    sm: 60,
    xs: 60,
  });

  return (
    <div
      style={{
        height,
        width,
        backgroundColor: theme.palette.background.default,
        overflow: "hidden",
        transition: animationsEnabled ? "width 400ms" : "width 200ms",
        transitionTimingFunction: "ease-in-out",
        display: "flex",
        flexDirection:
          mobilePortrait && meetingLayout === meetingLayouts.SIDEBAR
            ? "column"
            : "row",
        position: "relative",
      }}
    >
      <div
        style={{
          width: spotlightParticipantId
            ? sideBarPinnedParticipantIds?.length > 0
              ? width - presentingSideBarWidth
              : width
            : 0,
          height: mobilePortrait && !presenterId ? height / 2 : height,
          transition: animationsEnabled ? "width 800ms" : "width 400ms",
          transitionTimingFunction: "ease-in-out",
          paddingLeft: spacing,
          paddingTop: spacing,
        }}
      >
        <div
          style={{
            height:
              mobilePortrait && !presenterId
                ? height / 2 - 2 * spacing
                : height - 2 * spacing,
            width: mobilePortrait
              ? width - 2 * spacing
              : (spotlightParticipantId
                  ? (sideBarPinnedParticipantIds?.length > 0
                      ? width - presentingSideBarWidth
                      : width) -
                    2 * spacing
                  : 0) -
                (singleRow.length === 0
                  ? 2 * mainContainerHorizontalPadding
                  : 0),
            transition: animationsEnabled ? "width 800ms" : "width 400ms",
            transitionTimingFunction: "ease-in-out",
            borderRadius: theme.spacing(1),
            overflow: "hidden",
            position: "relative",
            marginLeft:
              singleRow.length === 0 ? mainContainerHorizontalPadding : 0,
            marginRight:
              singleRow.length === 0 ? mainContainerHorizontalPadding : 0,
          }}
        >
          {spotlightParticipantId ? (
            spotlightMediaType === "SHARE" ? (
              <PresenterView
                key={`spotlightParticipantId_${spotlightParticipantId}`}
                presenterId={spotlightParticipantId}
              />
            ) : spotlightMediaType === "WHITEBOARD" ? (
              <WhiteboardContainer
                {...{
                  ...convertHWAspectRatio({
                    height:
                      height -
                      2 * spacing -
                      (whiteboardToolbarWidth === 0 ? 2 * 16 : 0),
                    width: whiteboardStarted
                      ? width -
                        (isMobile ? 0 : presentingSideBarWidth) -
                        2 * spacing -
                        (whiteboardToolbarWidth + 2 * whiteboardSpacing) -
                        (whiteboardToolbarWidth === 0 ? 2 * 16 : 0)
                      : 0,
                  }),
                  whiteboardToolbarWidth,
                  whiteboardSpacing,
                  originalHeight: height - 2 * spacing,
                  originalWidth:
                    width -
                    (isMobile ? 0 : presentingSideBarWidth) -
                    2 * spacing,
                }}
              />
            ) : (
              <MemoizedMotionParticipant
                {...{
                  participantId: spotlightParticipantId,
                  gutter,
                  quality: "high",
                  relativeHeight: 100,
                  relativeWidth: 100,
                  relativeTop: 0,
                  relativeLeft: 0,
                }}
                key={`spotlightParticipantId_${spotlightParticipantId}`}
              />
            )
          ) : null}
        </div>
      </div>

      {singleRow.length === 0 ||
      (mobilePortrait && presenterId) ? null : mobilePortrait &&
        meetingLayout === meetingLayouts.SIDEBAR ? (
        <div
          style={{
            height: "50%",
            width: "100%",
            display: "flex",
            position: "relative",
          }}
        >
          {singleRow.map(
            ({
              participantId,
              relativeHeight,
              relativeWidth,
              relativeTop,
              relativeLeft,
            }) => {
              return (
                <div
                  style={{
                    padding: 8,
                    position: "absolute",
                    top: `${relativeTop}%`,
                    left: `${relativeLeft}%`,
                    width: `${relativeWidth}%`,
                    height: `${relativeHeight}%`,
                  }}
                  id={`pinned_sidebar_${participantId}`}
                  key={`pinned_sidebar_${participantId}`}
                >
                  <div
                    style={{
                      height: `calc(100% - ${2 * 8}px)`,
                      width: `calc(100% - ${2 * 8}px)`,
                    }}
                  >
                    <ParticipantViewer
                      participantId={participantId}
                      quality={"low"}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: theme.palette.background.default,
            overflowX: "hidden",
            overflowY: spotlightParticipantId ? "scroll" : "hidden",
            width: spotlightParticipantId ? presentingSideBarWidth : width,
            height:
              height -
              2 * spacing -
              (singleRow.length === 2 && !spotlightParticipantId && !isMobile
                ? 2 * gridVerticalSpacing
                : 0),
            margin: spacing,
            transition: animationsEnabled ? "all 800ms" : "all 400ms",
            transitionTimingFunction: "ease-in-out",
            paddingLeft: mainContainerHorizontalPadding,
            paddingRight: mainContainerHorizontalPadding,
            paddingTop:
              singleRow.length === 2 && !spotlightParticipantId && !isMobile
                ? gridVerticalSpacing
                : 0,
          }}
        >
          <div
            style={{
              height:
                (spotlightParticipantId
                  ? (singleRow.length * presentingSideBarWidth * 2) / 3
                  : height - 2 * spacing) -
                (singleRow.length === 2 && !spotlightParticipantId && !isMobile
                  ? 2 * gridVerticalSpacing
                  : 0),
              position: "relative",
              transition: animationsEnabled ? "height 800ms" : "height 400ms",
              transitionTimingFunction: "ease-in-out",
            }}
          >
            {singleRow.map((c) => (
              <MemoizedMotionParticipant
                {...c}
                quality={calcQuality(singleRow?.length)}
                key={`pinned_${c.participantId}`}
                gutter={gutter}
                useVisibilitySensor={presenterId ? true : false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(
  PinnedLayoutViewContainer,
  (prevProps, nextProps) =>
    prevProps.width === nextProps.width && prevProps.height === nextProps.height
);
