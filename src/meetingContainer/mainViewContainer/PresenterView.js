import React, { useMemo, useRef, useState } from "react";
import { ScreenShare } from "@material-ui/icons";
import { useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { Box, Button, Typography, useTheme } from "@material-ui/core";
import ParticipantViewer, { CornerDisplayName } from "./ParticipantViewer";
import useIsMobile from "../../utils/useIsMobile";
import {
  appEvents,
  eventEmitter,
  getGridForMainParticipants,
  getGridRowsAndColumns,
  localAndPinnedOnTop,
} from "../../utils/common";
import {
  meetingLayouts,
  useMeetingAppContext,
} from "../../MeetingAppContextDef";
import { useMediaQuery } from "react-responsive";
import ReactPlayer from "react-player";

const PresenterView = ({ presenterId }) => {
  const mMeeting = useMeeting();
  const videoPlayer = useRef();
  // const screenSharePlayer = useRef();
  // const webCamPlayer = useRef();
  const {
    webcamOn,
    micOn,
    isLocal,
    screenShareStream,
    screenShareOn,
    displayName,
    pin,
    unpin,
    pinState,
    // webcamStream,
  } = useParticipant(presenterId);
  const toggleScreenShare = mMeeting?.toggleScreenShare;
  // const participants = mMeeting?.participants;
  const localParticipantId = mMeeting?.localParticipant?.id;
  const pinnedParticipants = mMeeting?.pinnedParticipants;

  const isMobile = useIsMobile();
  const {
    setOverlaidInfoVisible,
    mainViewParticipants,
    meetingLayout,
    animationsEnabled,
  } = useMeetingAppContext();
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });

  const theme = useTheme();

  const [mouseOver, setMouseOver] = useState(false);

  const mediaStream = useMemo(() => {
    if (screenShareOn) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(screenShareStream.track);
      return mediaStream;
    }
  }, [screenShareStream, screenShareOn]);

  // useEffect(() => {
  //   if (webCamPlayer.current) {
  //     if (webcamOn) {
  //       const mediaStream = new MediaStream();
  //       mediaStream.addTrack(webcamStream.track);

  //       webCamPlayer.current.srcObject = mediaStream;
  //       webCamPlayer.current.play().catch((err) => {
  //         if (
  //           err.message ===
  //           "play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD"
  //         ) {
  //           console.error("screen share web cam " + err.message);
  //         }
  //       });
  //     } else {
  //       webCamPlayer.current.srcObject = null;
  //     }
  //   }
  // }, [isLocal, webcamOn, webcamStream, isPortrait]);

  // useEffect(() => {
  //   if (screenSharePlayer.current) {
  //     if (screenShareOn) {
  //       const mediaStream = new MediaStream();
  //       mediaStream.addTrack(screenShareStream.track);

  //       screenSharePlayer.current.srcObject = mediaStream;
  //       screenSharePlayer.current.play().catch((err) => {
  //         if (
  //           err.message ===
  //           "play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD"
  //         ) {
  //           console.error("screen share err" + err.message);
  //         }
  //       });
  //     } else {
  //       screenSharePlayer.current.srcObject = null;
  //     }
  //   }
  // }, [screenShareStream, screenShareOn]);

  const mobilePortrait = isMobile && isPortrait;

  const { singleRow } = useMemo(() => {
    let mainParticipants = [...mainViewParticipants];

    const participants = localAndPinnedOnTop({
      localParticipantId,
      participants: mainParticipants,
      pinnedParticipantIds: [...pinnedParticipants.keys()],
      moveLocalUnpinnedOnTop:
        pinnedParticipants.size && meetingLayout !== meetingLayouts.GRID
          ? false
          : true,
    });

    const splicesActiveParticipants = participants.splice(0, 4);
    // const splicesActiveParticipants = [...participants.keys()].splice(0, 4);

    const gridInfo = getGridRowsAndColumns({
      participantsCount: splicesActiveParticipants.length,
    });

    return getGridForMainParticipants({
      participants: splicesActiveParticipants,
      gridInfo,
    });
  }, [
    // participants,
    presenterId,
    mainViewParticipants,
    localParticipantId,
    pinnedParticipants,
    meetingLayout,
  ]);

  return (
    <div
      onMouseEnter={() => {
        setMouseOver(true);
      }}
      onMouseLeave={() => {
        setMouseOver(false);
      }}
      onDoubleClick={() => {
        eventEmitter.emit(appEvents["toggle-full-screen"]);
      }}
      onClick={() => {
        setOverlaidInfoVisible((s) => !s);
      }}
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        backgroundColor: "black",
        alignItems:
          mobilePortrait && meetingLayout !== meetingLayouts.SPOTLIGHT
            ? undefined
            : "center",
        justifyContent:
          mobilePortrait && meetingLayout !== meetingLayouts.SPOTLIGHT
            ? undefined
            : "center",
        display:
          mobilePortrait && meetingLayout !== meetingLayouts.SPOTLIGHT
            ? undefined
            : "flex",
      }}
    >
      <div
        style={{
          height: mobilePortrait ? "50%" : "100%",
          width: "100%",
          position: "relative",
        }}
        className={"video-contain"}
      >
        <>
          <ReactPlayer
            ref={videoPlayer}
            //
            playsinline // very very imp prop
            playIcon={<></>}
            //
            pip={false}
            light={false}
            controls={false}
            muted={true}
            playing={true}
            //
            url={mediaStream}
            //
            height={"100%"}
            width={"100%"}
            style={{
              filter: isLocal ? "blur(1rem)" : undefined,
            }}
            onError={(err) => {
              console.log(err, "presenter video error");
            }}
          />
        </>
        {isLocal && (
          <Box
            p={5}
            style={{
              borderRadius: theme.spacing(2),
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              backgroundColor: "#333244",
            }}
          >
            <ScreenShare
              style={{
                color: theme.palette.common.white,
                height: theme.spacing(6),
                width: theme.spacing(6),
              }}
            />
            <Box mt={2}>
              <Typography
                variant="h6"
                style={{
                  fontWeight: "bold",
                  color: theme.palette.common.white,
                }}
              >
                You are presenting to everyone
              </Typography>
            </Box>
            <Box mt={4}>
              <Button
                // onMouseEnter={() => {
                //   setMouseOver(true);
                // }}
                // onMouseLeave={() => {
                //   setMouseOver(false);
                // }}
                // onMouseDown={() => {
                //   setMouseDown(true);
                // }}
                // onMouseUp={() => {
                //   setMouseDown(false);
                // }}
                variant="contained"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleScreenShare();
                }}
                style={{
                  // transform: `scale(${
                  //   mouseOver ? (mouseDown ? 0.95 : 1.05) : 1
                  // })`,
                  transition: animationsEnabled ? "all 200ms" : "all 100ms",
                  transitionTimingFunction: "linear",
                }}
              >
                Stop presenting
              </Button>
            </Box>
          </Box>
        )}
      </div>
      <CornerDisplayName
        {...{
          isLocal,
          displayName,
          micOn,
          webcamOn,
          pin,
          unpin,
          pinState,
          isPresenting: true,
          participantId: presenterId,
          mouseOver,
        }}
      />
      {mobilePortrait && meetingLayout !== meetingLayouts.SPOTLIGHT ? (
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
                  key={`presenter_participant_${participantId}`}
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
      ) : null}
    </div>
  );
};

export default PresenterView;
