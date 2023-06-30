const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const convertDataIntoResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};
// API 1

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;

  let date = null;
  let getTodosQuery = "";

  // Scenario 1 ,we are using Switch cases Because of Different Scenarios
  switch (true) {
    /* hasStatusProperty */
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) => convertDataIntoResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // scenario 2
    /* hasPriorityProperty */
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
            SELECT *  FROM todo WHERE priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) => convertDataIntoResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // scenario 3
    // has priority and status properties
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = ` 
                    SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) => convertDataIntoResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // scenario 4
    /* hasSearchProperty */
    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachItem) => convertDataIntoResponseObject(eachItem))
      );
      break;

    // scenario 5
    /*  hasCategoryAndStatus */
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) => convertDataIntoResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // scenario 6
    /* hasCategoryProperty */
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) => convertDataIntoResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario 7
    /* hasCategoryAndPriority */
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) => convertDataIntoResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // default get all todos
    default:
      getTodosQuery = `SELECT * FROM todo;`;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachItem) => convertDataIntoResponseObject(eachItem))
      );
  }
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodosQuery = `SELECT * FROM todo WHERE id = ${todoId};`;

  const dbResponse = await db.get(getTodosQuery);
  response.send(convertDataIntoResponseObject(dbResponse));
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getDateQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const dbResponse = await db.all(getDateQuery);
    response.send(
      dbResponse.map((eachItem) => convertDataIntoResponseObject(eachItem))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");

          const postQuery = `
                 INSERT INTO 
                 todo(id,todo,priority,category,status,due_date)
                 VALUES
                 (${id},'${todo}','${priority}','${category}','${status}','${newDueDate}');`;

          await db.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateColumn = "";
  const requestBody = request.body;

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodo;

  // we are using Switch cases Because of Different Scenarios

  switch (true) {
    // update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `
                   UPDATE 
                      todo
                    SET
                      todo ='${todo}',
                      priority = '${priority}',
                      status = '${status}',
                      category = '${category}',
                      due_date = '${dueDate}'
                    WHERE id = ${todoId};`;

        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `
              UPDATE 
                  todo
              SET 
                todo ='${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
              WHERE id = ${todoId};`;

        await db.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // update todo
    case requestBody.todo !== undefined:
      updateTodo = `
              UPDATE 
                todo 
              SET 
                todo ='${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
              WHERE id = ${todoId};`;

      await db.run(updateTodo);
      response.send("Todo Updated");
      break;
    // update category

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `
                UPDATE 
                   todo 
                SET 
                  todo = '${todo}',
                  priority = '${priority}',
                  status = '${status}',
                  category = '${category}',
                  due_date = '${dueDate}' 
                WHERE id = ${todoId};`;

        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // update due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");

        updateTodo = `
                    UPDATE 
                       todo 
                    SET 
                      todo = '${todo}',
                      priority = '${priority}',
                      status = '${status}',
                      category = '${category}',
                      due_date = '${dueDate}' 
                    WHERE id = ${todoId};`;

        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});
// API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM 
        todo 
    WHERE 
        id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
