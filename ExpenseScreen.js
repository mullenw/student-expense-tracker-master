import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";

export default function ExpenseScreen() {
  const db = useSQLiteContext();

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function setup() {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL
        );
      `);

      loadExpenses();
    }

    setup();
  }, []);

  const loadExpenses = async () => {
    const rows = await db.getAllAsync(
      "SELECT * FROM expenses ORDER BY id DESC;"
    );
    setExpenses(rows);
  };

    const addExpense = async () => {
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) return;
    if (!category.trim()) return;

    const today = new Date().toISOString().slice(0, 10);

    await db.runAsync(
      "INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?);",
      [amountNumber, category.trim(), note.trim() || null, today]
    );

    resetForm();
    loadExpenses();
  };

  const startEditing = (expense) => {
    setEditingId(expense.id);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setNote(expense.note || "");
  };

  const updateExpense = async () => {
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) return;
    if (!category.trim()) return;

    await db.runAsync(
      "UPDATE expenses SET amount = ?, category = ?, note = ? WHERE id = ?;",
      [amountNumber, category.trim(), note.trim() || null, editingId]
    );

    cancelEditing();
    loadExpenses();
  };

  const deleteExpense = async (id) => {
    await db.runAsync("DELETE FROM expenses WHERE id = ?;", [id]);
    loadExpenses();
  };

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setNote("");
  };

  const cancelEditing = () => {
    resetForm();
    setEditingId(null);
  };
