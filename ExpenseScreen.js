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

    const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const filteredExpenses = expenses.filter((exp) => {
    const d = new Date(exp.date);

    if (filter === "WEEK") {
      return d >= startOfWeek;
    }

    if (filter === "MONTH") {
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    }

    return true;
  });

  const total = filteredExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  const categoryTotals = {};
  filteredExpenses.forEach((exp) => {
    if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
    categoryTotals[exp.category] += Number(exp.amount);
  });

    const renderExpense = ({ item }) => (
    <View style={styles.expenseRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={styles.expenseDate}>{item.date}</Text>
        {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
      </View>

      <View>
        <TouchableOpacity onPress={() => startEditing(item)}>
          <Text style={styles.edit}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => deleteExpense(item.id)}>
          <Text style={styles.delete}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleSubmit = () => {
    if (editingId) updateExpense();
    else addExpense();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Student Expense Tracker</Text>

      <View style={styles.filterRow}>
        {["ALL", "WEEK", "MONTH"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "ALL"
                ? "All"
                : f === "WEEK"
                ? "This Week"
                : "This Month"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Total Spending</Text>
        <Text style={styles.summaryAmount}>${total.toFixed(2)}</Text>

        <Text style={styles.summarySubtitle}>By Category</Text>
        {Object.keys(categoryTotals).length === 0 ? (
          <Text style={styles.summaryEmpty}>No expenses here.</Text>
        ) : (
          Object.entries(categoryTotals).map(([cat, amt]) => (
            <Text key={cat} style={styles.summaryCategory}>
              {cat}: ${amt.toFixed(2)}
            </Text>
          ))
        )}
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Amount"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Category"
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
        />

        <Button
          title={editingId ? "Save Changes" : "Add Expense"}
          onPress={handleSubmit}
        />

        {editingId && (
          <TouchableOpacity onPress={cancelEditing}>
            <Text style={styles.cancelEdit}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpense}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses found.</Text>
        }
      />

      <Text style={styles.footer}>Saved locally with SQLite</Text>
    </SafeAreaView>
  );
}
