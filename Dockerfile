FROM node:18.18.2-bullseye-slim

RUN apt-get update
RUN apt-get install -y software-properties-common build-essential
RUN apt-get install -y curl python3.9-distutils libpython3.9-dev
RUN ln -s /usr/bin/python3.9 /usr/bin/python
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python
RUN pip3 install --upgrade pip
ADD requirements.txt /requirements.txt
RUN pip3 install -r requirements.txt

WORKDIR /app
ADD index.html ./index.html
ADD src ./src
ADD package.json ./package.json
ADD vite.config.js ./vite.config.js
RUN npm install
ADD server.py ./server.py

CMD ["tail", "-f", "/dev/null"]