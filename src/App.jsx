import Calendar from "@toast-ui/react-calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Tasks from "./Tasks";
import { getColor } from "./Colors";
import theme from './CalenderTheme';
import Select, { components } from 'react-select';
import makeAnimated from 'react-select/animated';
import useLocalStorageState from 'use-local-storage-state'

import "./App.css";

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function App() {
  const [workHoursView, setWorkHoursView] = useLocalStorageState('workHoursView', {defaultValue: true});
  const [archived, setArchived] = useLocalStorageState('archived', {defaultValue: true});
  const [mineOnly, setMineOnly] = useLocalStorageState('mine_only', {defaultValue: true});
  const [weekName, setWeekName] = useState();
  const [spaceTags, setSpaceTags] = useState([]);
  const [genericTasks, setGenericTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedSpaceTags, setSelectedSpaceTags] = useLocalStorageState('selected_space_tags', {defaultValue: []});
  const [selectedTask, setSelectedTask] = useState({});
  const calendars = [{ id: "cal1", name: "Personal" }];

  const onClickEvent = useCallback((eventInfo) => {
    console.log("onClickEvent");

    const { id, calendarId } = eventInfo.event;
    cal.current.calendarInstance.deleteEvent(id, calendarId);
    deleteTimeEntry(id);
  }, []);
  const cal = useRef(null);

  const customThemeFn = (theme) => ({ 
    ...theme,
    spacing: {
      ...theme.spacing,
      controlHeight: 28,
      baseUnit: 1
    }
  })

  const getSprintTasks = (tags, mine_only, archived) => {
    fetch("http://localhost:8764/sprint_tasks/" + tags.value + "/" + mine_only + "/" + archived, {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setTasks(data);
      });
    };

  const onSelectDateTime = (eventData) => {
    console.log("onSelectDateTime");
    console.log("selectedTask.id:", selectedTask.id);
    console.log(eventData);
    const event = {
      calendarId: eventData.calendarId || "",
      id: String(Math.random()),
      taskId: selectedTask.id,
      title: " - " + selectedTask.custom_id + "\n" + selectedTask.name,
      isAllday: eventData.isAllday,
      start: eventData.start,
      end: eventData.end,
      category: eventData.isAllday ? "allday" : "time",
      dueDateClass: "",
      backgroundColor: selectedTask.color,
    };

    createTimeEntry(event);
    cal.current.calendarInstance.clearGridSelections();
  };

  const onBeforeUpdateEvent = useCallback((updateData) => {
    console.log("onBeforeUpdateEvent");
    console.log(updateData);
    const targetEvent = updateData.event;
    const changes = { ...updateData.changes };
    cal.current.calendarInstance.updateEvent(
      targetEvent.id,
      targetEvent.calendarId,
      changes
    );
    const start = changes.start === undefined ? targetEvent.start : changes.start;
    updateTimeEntry(targetEvent.id, targetEvent.body, start / 1000, changes.end / 1000);
  }, []);

  const updateTimeEntry = (timeEntryId, taskId, start, end) => {
    fetch(
      "http://localhost:8764/update_time_entry/" + timeEntryId + "/" + taskId + "/" + start + "/" + end,
      {
        method: "GET",
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        getTimeEntries(cal, []);
      });
  };

  const deleteTimeEntry = (timeEntryId) => {
    fetch(
      "http://localhost:8764/delete_time_entry/" + timeEntryId,
      {
        method: "GET",
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        getTimeEntries(cal, []);
      });
  };

  const createTimeEntry = (event) => {
    console.log(event)
    fetch(
      "http://localhost:8764/create_time_entry/" +
        event.start.getTime() / 1000 +
        "/" +
        event.end.getTime() / 1000 +
        "/" +
        event.taskId,
      {
        method: "GET",
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        getTimeEntries(cal, []);
      });
  };

  const nextWeek = (event) => {
    cal.current.calendarInstance.next();
    getTimeEntries(cal, []);
    setWeekTitle(cal);
  };

  const prevWeek = (event) => {
    cal.current.calendarInstance.prev();
    getTimeEntries(cal, []);
    setWeekTitle(cal);
  };

  const setWeekTitle = (cal) => {
    setWeekName(
      cal.current.calendarInstance
        .getDateRangeStart()
        .d.d.toLocaleDateString("en-GB") +
        " - " +
        cal.current.calendarInstance
          .getDateRangeEnd()
          .d.d.toLocaleDateString("en-GB")
    );
  };

  const getTimeEntries = (cal, generic_tasks) => {
    if (generic_tasks.length == 0) {
      generic_tasks = genericTasks;
    }
    const start = cal.current.calendarInstance.getDateRangeStart() / 1000;
    const end = cal.current.calendarInstance.getDateRangeEnd() / 1000 + 24 * 60 * 60;
    fetch(
      "http://localhost:8764/time_entries/" + start + "/" + end,
      {
        method: "GET",
      }
    )
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      setTimeEntries(data);
      cal.current.calendarInstance.clear();
      populateEvents(data, cal, generic_tasks);
    });
  };

  useEffect(() => {
    getGenericTasks();
    setWeekTitle(cal);
    getSpaceTags();
  }, []);

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const populateEvents = (timeEntries, cal, generic_tasks) => {
    timeEntries.map((timeEntry) => {
      if (timeEntry.task.custom_id === undefined) {
        generic_tasks.map((genericTask) => {
          if (genericTask.id === timeEntry.task.id) {
            timeEntry.task.custom_id = genericTask.custom_id;
          }
        });
      }

      const event = {
        calendarId: cal.current.calendarInstance.calendarId || "",
        id: timeEntry.id,
        title: " - " + timeEntry.task.custom_id + "\n" + timeEntry.task.name,
        body: timeEntry.task.id,
        isAllday: false,
        start: new Date(Number(timeEntry.start)),
        end: new Date(Number(timeEntry.end)),
        category: "time",
        dueDateClass: "",
        backgroundColor: getColor(timeEntry.task.custom_id),
      };
      cal.current.calendarInstance.createEvents([event]);
    });
  };

  const getSpaceTags = () => {
    fetch(
      "http://localhost:8764/get_space_tags",
        {
          method: "GET",
        }
      ).then((response) => {
          return response.json();
        })
        .then((data) => {
          setSpaceTags(data);
        }
      );
  }

  const getGenericTasks = () => {
    fetch(
      "http://localhost:8764/generic_tasks",
        {
          method: "GET",
        }
      ).then((response) => {
          return response.json();
        })
        .then((data) => {
          setGenericTasks(data);
          return data;
        })
        .then((data) => {
          getTimeEntries(cal, data);
        });
  }

  const handleSpaceTagChange = (event) => {
    setSelectedSpaceTags(event);
    getSprintTasks(event, mineOnly, archived);
  }

  const handleMineOnlyCheckbox = (new_state) => {
    setMineOnly(new_state);
    getSprintTasks(selectedSpaceTags, new_state, archived);
  };
  
  const handleArchivedCheckbox = (new_state) => {
    setArchived(new_state);
    getSprintTasks(selectedSpaceTags, mineOnly, new_state);
  };

  const handleWorkdayViewCheckbox = (event) => {
    console.log(event);
    setWorkHoursView(!workHoursView);
  };

  function adjust(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }

  return (
    <div>
      <div>
        <div
          className="row"
          style={{ width: "1550px", height: "30px", margin: "10px" }}
        >
          <h2 className="col-3" style={{ margin: "5px" }}>
            {weekName}
          </h2>
          <button
            type="button"
            className="btn btn-primary col-1"
            onClick={prevWeek}
            style={{ margin: "5px" }}
          >
            Prev
          </button>
          <button
            type="button"
            className="btn btn-primary col-1"
            onClick={nextWeek}
            style={{ margin: "5px" }}
          >
            Next
          </button>
          <div className="form-check col-2" style={{ marginTop: "10px"}}>
            <input className="form-check-input" type="checkbox" value="" id="defaultCheck1" checked={workHoursView} onChange={handleWorkdayViewCheckbox} />
            <label className="form-check-label" htmlFor="defaultCheck1">
              Show workhours only
            </label>
          </div>
          <div className="form-check col-1" style={{ marginTop: "7px", marginLeft: "0px", width: "350px"}}>
          <Select
            key="tag_select"
            closeMenuOnSelect={true}
            components={makeAnimated()}
            defaultValue={selectedSpaceTags}
            options={
              spaceTags.map((element) => {
                return {
                  value: element.name,
                  label: element.name,
                  tag_bg: element.tag_bg,
                  tag_fg: element.tag_fg,
                }
              })
            }
            styles={{
              control: (styles) => ({ ...styles, backgroundColor: 'white' }),
              option: (styles, { data, isDisabled, isFocused, isSelected }) => {return {
                backgroundColor: data.tag_bg,
                color: "white",
                cursor: 
                  'default',
                  ':hover': {
                    ...styles[':hover'],
                    backgroundColor: adjust(data.tag_bg, 40)
                  },
              };},
              multiValueLabel: (styles, { data }) => ({
                ...styles,
                backgroundColor: data.tag_bg,
                color: "white"
              }),
            }}
            theme={customThemeFn}
            onChange={handleSpaceTagChange}
          />
          </div>
          <div className="form-check col-1" style={{ marginTop: "10px"}}>
            <input className="form-check-input" type="checkbox" value="" id="defaultCheck2" checked={mineOnly} onChange={() => handleMineOnlyCheckbox(!mineOnly)} />
            <label className="form-check-label" htmlFor="defaultCheck2">
              Mine only
            </label>
          </div>
          <div className="form-check col-1" style={{ marginTop: "10px"}}>
            <input className="form-check-input" type="checkbox" value="" id="defaultCheck3" checked={archived} onChange={() => handleArchivedCheckbox(!archived)} />
            <label className="form-check-label" htmlFor="defaultCheck3">
              Archived
            </label>
          </div>
        </div>
        <div className="box">
          <Calendar
            ref={cal}
            onSelectDateTime={onSelectDateTime}
            height="800px"
            view="week"
            calendars={calendars}
            useFormPopup={false}
            usageStatistics={false}
            onClickEvent={onClickEvent}
            onBeforeUpdateEvent={onBeforeUpdateEvent}
            week={{
              workweek: true,
              hourStart: workHoursView ? 9 : 0,
              hourEnd: workHoursView ? 17 : 24,
              taskView: false,
              eventView: ["time"],
            }}
            theme={theme}
          />
        </div>
        <div className="boxhalf">
          <Tasks
            setSelectedTask={setSelectedTask}
            selectedTask={selectedTask}
            getSprintTasks={() => getSprintTasks(selectedSpaceTags, mineOnly, archived)}
            tasks={tasks}
           />
        </div>
      </div>
      <div></div>
      <div></div>
    </div>
  );
}

export default App;
