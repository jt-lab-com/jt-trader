# jtl-env-frontend

---

<!-- TOC -->
* [jtl-env-frontend](#jtl-env-frontend)
    * [Project architecture](#project-architecture)
    * [Required env](#required-env)
    * [Tests](#tests)
    * [Entities](#entities)
    * [Features](#features)
    * [Widgets](#widgets)
<!-- TOC -->

---

## Project architecture

The project is written in accordance with the methodology [Feature Sliced Design](https://feature-sliced.design/).

---

## Required env

You need to create `app-config.json` file and put the required env there

| Env                              | Description                                    |
|----------------------------------|------------------------------------------------|
| **DOWNLOADED_HISTORY_BARS_PATH** | path to binance candle history download folder |
| **ARTIFACTS_PATH**               | path to json artifacts                         |
| **WEBSOCKET_HOST**               | ws host                                        |
| **AUTH_USER**                    | _ex.:_ admin                                   |
| **AUTH_PASS**                    | _ex.:_ admin                                   |


---

## Tests

_no information_

---

## Entities

- [Artifact](/client/src/entities/artifact)
- [Job](/client/src/entities/job)
- [Scenario](/client/src/entities/scenario)
- [Strategy](/client/src/entities/strategy)
- [Logs](/client/src/entities/log)
- [CodeEditor](/client/src/entities/code-editor)

---

## Features

- [Job](/client/src/features/job)
- [Scenario](/client/src/features/scenario)
- [Strategy](/client/src/features/strategy)
- [Server](/client/src/features/server)

## Widgets

- [VersionInfo](/client/src/widgets/version-info)
