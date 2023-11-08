from typing import Optional
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from datetime import datetime, timedelta
import inspect
import json
import requests
import logging
from pprint import pprint

CLICKUP_API_KEY = os.environ.get("CLICKUP_API_KEY")
TASKS_FROM_TIME_ENTRIES_DAYS = 180  # Get tasks from time entries from the last 180 days
SPACE_NAME = "Backlog & Development Management"

from functools import wraps

def cache(func):
    cache_dict = {}

    @wraps(func)
    def wrapper(*args, **kwargs):
        key = (args, frozenset(kwargs.items()))

        if key in cache_dict:
            return cache_dict[key]

        result = func(*args, **kwargs)
        cache_dict[key] = result

        return result

    def clear_cache(*args, **kwargs):
        if not args and not kwargs:
            cache_dict.clear()
        else:
            key = (args, frozenset(kwargs.items()))
            if key in cache_dict:
                del cache_dict[key]

    wrapper.clear_cache = clear_cache
    return wrapper


def print_instance(instance):
    pprint([i for i in  inspect.getmembers(instance) if not i[0].startswith('_')])

def pprint_dict(object):
    print(json.dumps(object, indent=4, sort_keys=True))

def get_header():
    return {"Authorization":CLICKUP_API_KEY}

def get_request(url):
    a = datetime.now()
    results = requests.get(url, headers=get_header())
    b = datetime.now()
    logging.info(f"GET {url}, took {(b-a).total_seconds()} seconds")
    if results.status_code != 200:
        print_instance(results)
    return(results.json())

@cache
def get_user():
    return get_request("https://api.clickup.com/api/v2/user")

@cache
def get_team():
    return get_request("https://api.clickup.com/api/v2/team")

@cache
def get_time_entry(team_id, timer_id):
    return get_request(f"https://api.clickup.com/api/v2/team/{team_id}/time_entries/{timer_id}?include_task_tags=true")

@cache
def get_time_entries(team_id, start_date, end_date, assignee):
    start_date = int(start_date.timestamp() * 1000)
    end_date = int(end_date.timestamp() * 1000)
    response = get_request(f"https://api.clickup.com/api/v2/team/{team_id}/time_entries?start_date={start_date}&end_date={end_date}&assignee={assignee}")
    return response

def get_time_entry_body(start, end, duration_hours, task_id, user_id, tags):
    if len(tags) == 0:
        return
    billable = len(tags) > 1 or tags[0]["name"] != "client: brainnwave"
    return {
        "description": "",
        "tags": tags,
        "start": int(start.timestamp() * 1000),
        "end": int(end.timestamp() * 1000),
        "billable": "true" if billable else "false",
        "duration": int(duration_hours * 60 * 60 * 1000),
        "assignee": user_id,
        "tid": task_id
    }

def update_time_entry_in_clickup(timer_id, start, end, duration_hours, task_id, user_id, team_id):
    time_entry = get_time_entry(team_id, timer_id)
    tags = time_entry["data"]["tags"]
    body = get_time_entry_body(start, end, duration_hours, task_id, user_id, tags)
    body["tag_action"] = "replace"
    del body["assignee"] 
    response = requests.put(f"https://api.clickup.com/api/v2/team/{team_id}/time_entries/{timer_id}", json=body, headers=get_header())
    get_time_entries.clear_cache()
    return response

def create_time_entry_in_clickup(start, end, duration_hours, task_id, user_id, team_id, tags):
    body = get_time_entry_body(start, end, duration_hours, task_id, user_id, tags)
    response = requests.post(f"https://api.clickup.com/api/v2/team/{team_id}/time_entries", json=body, headers=get_header())
    get_time_entries.clear_cache()
    return response

def delete_time_entry_in_clickup(team_id, timer_id):
    response = requests.delete(f"https://api.clickup.com/api/v2/team/{team_id}/time_entries/{timer_id}", headers=get_header())
    get_time_entries.clear_cache()
    return response

@cache
def get_spaces(team_id, archived=False):
    archived = "?archived=true" if archived else "?archived=false"
    return get_request(f"https://api.clickup.com/api/v2/team/{team_id}/space{archived}")

@cache
def get_sprint_space(archived=False):
    for space in get_spaces(get_team_id(), archived=False)["spaces"]:
        if space["name"] == SPACE_NAME:
            return space
    raise KeyError(f"SPACE: {SPACE_NAME} not found (has it been renamed?)")

@cache
def get_team_id():
    return get_team()["teams"][0]["id"]

@cache
def get_sprint_space_id(archived=False):
    return get_sprint_space(archived)["id"]

@cache
def get_folders(space_id, archived=False):
    archived = "?archived=true" if archived else "?archived=false"
    return get_request(f"https://api.clickup.com/api/v2/space/{space_id}/folder{archived}")

@cache
def get_sprint_folders(archived=False):
    return get_folders(get_sprint_space_id(archived), archived)["folders"]

@cache
def get_lists(folder_id, archived=False):
    archived = "?archived=true" if archived else "?archived=false"
    return get_request(f"https://api.clickup.com/api/v2/folder/{folder_id}/list{archived}")

@cache
def get_sprint_lists(archived=False):
    sprint_lists = []
    for sprint_folder in get_sprint_folders(archived):
       sprint_lists.extend(get_lists(sprint_folder["id"], archived)["lists"])
    return sprint_lists

@cache
def get_tasks(list_id, assignee=None, tag=None, archived=False):
    if assignee:
        url = f"https://api.clickup.com/api/v2/list/{list_id}/task?assignees={assignee}&assignees={assignee}&include_closed=true"
    else:
        url = f"https://api.clickup.com/api/v2/list/{list_id}/task?include_closed=true"
    url = url + f"&tags={tag}&tags={tag}" if tag else url
    url = url + "&archived=true" if archived else url
    print(f"{url=}")
    return get_request(url)

@cache
def get_space_tags_from_clickup(space_id):
    return get_request(f'https://api.clickup.com/api/v2/space/{space_id}/tag')["tags"]

# @hug.get()
@app.get("/get_space_tags")
def get_space_tags():
    space_id = get_sprint_space_id()
    space_tags = get_space_tags_from_clickup(space_id)
    space_tags.sort(key=lambda tag: tag["name"])
    return space_tags

def get_sprint_tasks(assignee=None, tag:Optional[str]=None, mine_only: bool=True, archived: bool=False):
    sprint_tasks = []
    if not mine_only:
        assignee = None
    for sprint_list in get_sprint_lists(archived):
        sprint_tasks.extend(get_tasks(sprint_list["id"], assignee, tag, archived)["tasks"])
    sprint_tasks.sort(key=lambda task: task["custom_id"], reverse=True)
    return sprint_tasks


def multisort(data: list[dict], specs: tuple[tuple[str, bool], ...]) -> list[dict]:
    """From: https://docs.python.org/3/howto/sorting.html#sortinghowto"""

    for key, reverse in reversed(specs):
        data.sort(key=lambda value: (value[key] or "").lower(), reverse=reverse)
    return data


def _dict_to_tuple(d):
    return tuple(sorted(d.items()))


def deduplicate(data: list[dict]) -> list[dict]:
    """deduplicate"""

    return [dict(key_value_tuple) for key_value_tuple in {_dict_to_tuple(record): record for record in data}.values()]

@cache
def get_time_entry_tags():
    """Get all the labels that have been applied to time entries in a Workspace."""
    
    team_id = get_team_id()
    response = get_request(f"https://api.clickup.com/api/v2/team/{team_id}/time_entries/tags")
    return response

@app.get("/sprint_tasks/{tag}/{mine_only}/{archived}")
async def sprint_tasks(tag=None, mine_only=True, archived=False):
    me = get_user()["user"]["id"]
    if mine_only == "false":
        mine_only = False
    else:
        mine_only = True
    if archived == "false":
        archived = False
    else:
        archived = True

    sprint_tasks = get_sprint_tasks(me, tag, mine_only, archived)
    sprint_tasks = [
        {key:value for key,value in task.items() if key in ["id", "custom_id", "name"]}
        for task
        in sprint_tasks
    ]
    end = datetime.now()
    start = datetime.now() - timedelta(days=TASKS_FROM_TIME_ENTRIES_DAYS)
    time_series_tasks = get_time_entries(get_team_id(), start, end, me)["data"]
    task_tags_map = {task["task"]["id"]: task["tags"] for task in time_series_tasks}
    time_series_tasks = [
        {key:value for key,value in task["task"].items() if key in ["id", "custom_id", "name"]}
        for task
        in time_series_tasks
    ]

    tasks = sprint_tasks + [{'id': '2tfb48r', 'name': 'Agile processes & product management'}]
    for task in tasks:
        if "custom_id" not in task:
            task["custom_id"] = "BW-9999"
    tasks = deduplicate(tasks)
    tasks.sort(key=lambda task: task["custom_id"], reverse=True)
    tasks = [
        task | {"tags": task_tags_map.get(task["id"], [])}
        for task
        in tasks
    ]
    tasks = [
        task | {"tags": [{'name': 'client: brainnwave', 'tag_bg': '#7C4DFF', 'tag_fg': '#7C4DFF', 'creator': 38587763}]} if task["custom_id"] == "BW-9999" else task
        for task
        in tasks        
    ]
    return tasks


@app.get("/time_entries/{start}/{end}")
def time_entries(start: int, end: int):
    me = get_user()["user"]["id"]
    return get_time_entries(get_team_id(), datetime.fromtimestamp(int(start)), datetime.fromtimestamp(int(end)), me)["data"]


@app.get("/time_entry_tags")
def time_entry_tags():
    response = get_time_entry_tags()
    response["data"].sort(key=lambda tag: tag["name"].replace("client: ", "").replace("project: ", ""))
    return response

@app.get("/create_time_entry/{start}/{end}/{task_id}")
def create_time_entry(start, end, task_id, tags):
    tags=eval(tags)
    me = get_user()["user"]["id"]
    team_id = get_team_id()
    duration_hours = (datetime.fromtimestamp(int(end)) - datetime.fromtimestamp(int(start))).total_seconds() / 60 / 60
    response = create_time_entry_in_clickup(datetime.fromtimestamp(int(start)), datetime.fromtimestamp(int(end)), duration_hours, task_id, me, team_id, tags)
    return response.json()


@app.get("/delete_time_entry/{timer_id}")
def delete_time_entry(timer_id):
    team_id = get_team_id()
    response = delete_time_entry_in_clickup(team_id, timer_id)
    return response.json()

@app.get("/update_time_entry/{timer_id}/{task_id}/{start}/{end}")
def update_time_entry(timer_id, task_id, start, end):
    me = get_user()["user"]["id"]
    team_id = get_team_id()
    duration_hours = (datetime.fromtimestamp(int(end)) - datetime.fromtimestamp(int(start))).total_seconds() / 60 / 60
    response = update_time_entry_in_clickup(timer_id, datetime.fromtimestamp(int(start)), datetime.fromtimestamp(int(end)), duration_hours, task_id, me, team_id)
    return response.json()

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
