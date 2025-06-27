# Entity Scenario

---

## Description

_documentation is in the process of being written..._

---

## Public api

#### UI

- `ScenarioList` - render scenario list


#### Hooks

- `useScenario` - return scenario list. Initialization occurs (subscribe to ws events)

````typescript
const { scenarioList } = useScenario();
````

#### Reducer

- `scenarioReducer` - store reducer

#### Types

- `Scenario` - scenario interface
- `ScenarioSchema` - reducer schema
- `ScenarioScope` - scenario dynamic args

---