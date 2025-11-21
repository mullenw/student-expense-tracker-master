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
