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
    const rows = await db.getAllAsync("SELECT * FROM expenses ORDER BY id DESC;");
    setExpenses(rows);
  };

  const reset = () => {
    setAmount("");
    setCategory("");
    setNote("");
    setEditingId(null);
  };

  const submit = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || !category.trim()) return;

    if (editingId) {
      await db.runAsync(
        "UPDATE expenses SET amount=?, category=?, note=? WHERE id=?;",
        [val, category.trim(), note.trim() || null, editingId]
      );
    } else {
      const today = new Date().toISOString().slice(0, 10);
      await db.runAsync(
        "INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?);",
        [val, category.trim(), note.trim() || null, today]
      );
    }

    reset();
    loadExpenses();
  };

  const remove = async (id) => {
    await db.runAsync("DELETE FROM expenses WHERE id=?;", [id]);
    loadExpenses();
  };

  const startEdit = (e) => {
    setEditingId(e.id);
    setAmount(String(e.amount));
    setCategory(e.category);
    setNote(e.note || "");
  };

  const today = new Date();
  const startWeek = new Date(today);
  startWeek.setDate(today.getDate() - today.getDay());

  const filtered = expenses.filter((e) => {
    const d = new Date(e.date);
    if (filter === "WEEK") return d >= startWeek;
    if (filter === "MONTH")
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    return true;
  });

  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  const catTotals = filtered.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.date}>{item.date}</Text>
        {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
      </View>

      <View>
        <TouchableOpacity onPress={() => startEdit(item)}>
          <Text style={styles.edit}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => remove(item.id)}>
          <Text style={styles.delete}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Student Expense Tracker</Text>

      <View style={styles.filterRow}>
        {[
          ["ALL", "All"],
          ["WEEK", "This Week"],
          ["MONTH", "This Month"],
        ].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.filterBtn, filter === key && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Total Spending</Text>
        <Text style={styles.summaryAmount}>${total.toFixed(2)}</Text>

        <Text style={styles.summarySub}>By Category</Text>
        {Object.keys(catTotals).length === 0 ? (
          <Text style={styles.empty}>No expenses here.</Text>
        ) : (
          Object.entries(catTotals).map(([cat, amt]) => (
            <Text key={cat} style={styles.summaryCat}>
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

        <Button title={editingId ? "Save Changes" : "Add Expense"} onPress={submit} />

        {editingId && (
          <TouchableOpacity onPress={reset}>
            <Text style={styles.cancel}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No expenses found.</Text>}
      />
    </SafeAreaView>
  );
}
