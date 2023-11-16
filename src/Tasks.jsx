import { useState, useEffect } from "react";
import { getColor } from "./Colors";
import useLocalStorageState from 'use-local-storage-state'
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

const Tasks = (props) => {
  const [ticketTags, setTicketTags] = useLocalStorageState('ticket_tags', {defaultValue: {}});

  useEffect(() => {
    props.getSprintTasks();
  }, []);

  const selectTask = (event, task) => {
    props.setSelectedTask(task);
  };

  const customThemeFn = (theme) => ({ 
    ...theme,
    spacing: {
      ...theme.spacing,
      controlHeight: 28,
      baseUnit: 1
    }
  })

  function adjust(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }

  return (
    <table className="table table-hover">
      <thead>
        <tr>
          <th className="col-1">Color</th>
          <th className="col-2">ID</th>
          <th className="col-15">Task</th>
        </tr>
      </thead>
      <tbody>
        {props.tasks.map((task) => (
          <tr
            key={task["custom_id"]}
            onClick={(event) => {
              selectTask(event, {
                id: task["id"],
                custom_id: task["custom_id"],
                name: task["name"],
                color: getColor(task["custom_id"]),
                tags: ticketTags[task["custom_id"]],
              });
            }}
            className={
              props.selectedTask["custom_id"] === task["custom_id"]
                ? "table-primary"
                : null
            }
          >
            <td style={{ color: getColor(task["custom_id"]) }}>█</td>
            <td>{task["custom_id"]}</td>
            <td>{task["name"]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Tasks;
