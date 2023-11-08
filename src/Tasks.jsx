import { useState, useEffect } from "react";
import { getColor } from "./Colors";
import useLocalStorageState from 'use-local-storage-state'
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

const Tasks = (props) => {
  const [ticketTags, setTicketTags] = useLocalStorageState('ticket_tags', {defaultValue: {}});
  const [tags, setTags] = useState([]);

  const getTimeEntryTags = () => {
    fetch("http://localhost:8764/time_entry_tags", {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setTags(data.data);
      });
  };

  useEffect(() => {
    getTimeEntryTags();
    props.getSprintTasks();
  }, []);

  const selectTask = (event, task) => {
    console.log("Set selected task:", task.name);
    console.log("Set selected task:", task);
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

  const handleTagChange = (event, custom_id) => {
    console.log(event, custom_id);
    console.log(ticketTags);
    const tags = {...ticketTags};
    tags[custom_id] = event;
    setTicketTags(tags);
    console.log(ticketTags);
  }

  const tagSelection = (custom_id) => {
    return <Select
      key="selectTag_${custom_id}"
      closeMenuOnSelect={false}
      components={makeAnimated()}
      isMulti
      defaultValue={ticketTags[custom_id] || []}
      options={
        tags.map((element) => {
          return {
            value: element.name,
            label: element.name.replace("client: ", "").replace("project: ", ""),
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
      onChange={(event) => handleTagChange(event, custom_id)}
    />
  }; 

  return (
    <table className="table table-hover">
      <thead>
        <tr>
          <th className="col-1">Color</th>
          <th className="col-1">ID</th>
          <th className="col-15">Task</th>
          <th className="col-4">Tags</th>
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
            <td>{tagSelection(task["custom_id"])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Tasks;
