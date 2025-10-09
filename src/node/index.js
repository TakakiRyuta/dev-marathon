const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

const port = 5237;

const cors = require("cors");
app.use(cors());

const { Pool } = require("pg");
const pool = new Pool({
  user: "user_5237", // PostgreSQLのユーザー名に置き換えてください
  host: "db",
  database: "crm_5237", // PostgreSQLのデータベース名に置き換えてください
  password: "pass_5237", // PostgreSQLのパスワードに置き換えてください
  port: 5432,
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 10KMで追加したところ
app.get("/customer/:customerId", async (req, res) => {
  const { customerId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM customers WHERE customer_id = $1",
      [customerId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "not found" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});
//10KM追加分ここまで

app.post("/add-customer", async (req, res) => {
  try {
    const { companyName, industry, contact, location } = req.body;
    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [companyName, industry, contact, location]
    );
    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.use(express.static("public"));
