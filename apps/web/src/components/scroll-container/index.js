import React from "react";
import { Box } from "rebass";
import { Scrollbars } from "rc-scrollbars";

const ScrollContainer = ({ children, style, forwardedRef, ...props }) => {
  return (
    <Scrollbars
      {...props}
      autoHide
      ref={(sRef) => forwardedRef && sRef && forwardedRef(sRef.view)}
      style={{ ...style, overflowY: "hidden" }}
      renderView={({ style, ...props }) => (
        <Box {...props} style={{ ...style, inset: "-1px" }} />
      )}
      renderThumbVertical={({ style, ...props }) => (
        <Box
          {...props}
          style={{
            ...style,
            backgroundColor: "var(--bgSecondaryText)",
          }}
        />
      )}
    >
      {children}
    </Scrollbars>
  );
};
export default ScrollContainer;

export function FlexScrollContainer({ children, className, ...props }) {
  return (
    <Scrollbars
      {...props}
      autoHide
      style={{
        overflowY: "hidden",
        height: "auto",
        width: "auto",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
      }}
      renderView={({ style, ...props }) => (
        <Box
          {...props}
          className={className}
          style={{
            overflow: "scroll",
            position: "relative",
            flex: "1 1 auto",
          }}
          sx={{
            scrollbarWidth: "none",
            "::-webkit-scrollbar": { width: 0, height: 0 },
            msOverflowStyle: "none",
          }}
        />
      )}
      renderThumbVertical={({ style, ...props }) => (
        <Box
          {...props}
          style={{
            ...style,
            backgroundColor: "var(--bgSecondaryText)",
          }}
        />
      )}
    >
      {children}
    </Scrollbars>
  );
}

export const CustomScrollbarsVirtualList = React.forwardRef((props, ref) => {
  return (
    <ScrollContainer {...props} forwardedRef={(sRef) => (ref.current = sRef)} />
  );
});
