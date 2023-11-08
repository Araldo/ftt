const theme = {
    common: {
      border: "10px solid #000",
      backgroundColor: "f54f3d",
      dayName: { color: "#333" },
      today: { color: "#009688" },
      gridSelection: {
        backgroundColor: "rgba(19, 93, 230, 0.1)",
        border: "1px solid #135de6",
      },
    },
    week: {
      dayName: {
        borderTop: "1px solid #000",
        borderBottom: "1px solid #000",
        borderLeft: "1px solid #ddd",
        backgroundColor: "inherit",
      },
      today: {
        color: "#009688",
        backgroundColor: "inherit",
      },
      pastDay: { color: "#999" },
      panelResizer: { border: "1px solid #ddd" },
      dayGrid: { borderRight: "1px solid #ddd" },
      dayGridLeft: {
        width: "50px",
        backgroundColor: "",
        borderRight: "1px solid #ddd",
      },
      weekend: { backgroundColor: "inherit" },
      timeGridLeft: {
        width: "50px",
        backgroundColor: "#fafafa",
        borderRight: "1px solid #ddd",
      },
      timeGridLeftAdditionalTimezone: { backgroundColor: "#fdfdfd" },
      timeGridHourLine: { borderBottom: "1px solid #eee" },
      timeGridHalfHourLine: { borderBottom: "1px dotted #f9f9f9" },
      timeGrid: { borderRight: "1px solid #ddd" },
      nowIndicatorLabel: { color: "#135de6" },
      nowIndicatorPast: {
        border: "1px solid rgba(19, 93, 230, 0.3)",
      },
      nowIndicatorBullet: { backgroundColor: "#135de6" },
      nowIndicatorToday: { border: "1px solid #135de6" },
      nowIndicatorFuture: { border: "1px solid #135de6" },
      pastTime: { color: "#999" },
      futureTime: { color: "#333" },
      gridSelection: { color: "#135de6" },
    },
  }

export default theme;