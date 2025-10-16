const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

const port = 5237;

const cors = require("cors");
app.use(cors());

const { Pool } = require("pg");
const pool = new Pool({
  user: "user_ryuta_takaki", // PostgreSQLのユーザー名に置き換えてください
  host: "localhost",
  database: "db_ryuta_takaki", // PostgreSQLのデータベース名に置き換えてください
  password: "pass", // PostgreSQLのパスワードに置き換えてください
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

//11KMで追加したところ(削除のapi)
app.delete("/customer/:customerId", async (req, res) => {
  const { customerId } = req.params;
  try{
    const result = await pool.query(
      "DELETE FROM customers WHERE customer_id = $1",
      [customerId]
    );
    if(result.rowCount === 0) {
      res.status(404).json({ success: false,error: "not found"});
      return;
    }
    res.json({ success: true});
  } catch (err){
    res.status(500).json({ success: false, error: "server error"});
  }
})
//11KM追加ここまで

//12KM追加分（更新機能）
app.put("/customer/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const { companyName, industry, contact, location } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers
         SET company_name = $1,
             industry = $2,
             contact = $3,
             location = $4,
             updated_date = NOW()
       WHERE customer_id = $5`,
      [companyName, industry, contact, location, customerId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: "not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "server error" });
  }
});
//12KMここまで

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
