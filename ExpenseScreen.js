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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#111827" },
  heading: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 16 },

  filterRow: { flexDirection: "row", marginBottom: 12 },
  filterBtn: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#4b5563",
    alignItems: "center",
  },
  filterActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  filterText: { color: "#e5e7eb", fontSize: 12 },
  filterTextActive: { color: "#fff" },

  summary: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#1f2937",
    marginBottom: 16,
  },
  summaryTitle: { color: "#e5e7eb", fontSize: 14 },
  summaryAmount: { color: "#fbbf24", fontSize: 22, fontWeight: "700" },
  summarySub: { color: "#9ca3af", fontSize: 12, marginTop: 6 },
  summaryCat: { color: "#d1d5db", fontSize: 12 },

  form: { marginBottom: 16, gap: 8 },
  input: {
    padding: 10,
    backgroundColor: "#1f2937",
    color: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  cancel: { color: "#f97316", marginTop: 8, textAlign: "center" },

  row: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    marginBottom: 8,
  },
  amount: { color: "#fbbf24", fontSize: 18, fontWeight: "700" },
  category: { color: "#e5e7eb", fontSize: 14 },
  date: { color: "#9ca3af", fontSize: 11 },
  note: { color: "#9ca3af", fontSize: 12 },
  edit: { color: "#60a5fa", marginBottom: 8 },
  delete: { color: "#ef4444", fontSize: 20 },

  empty: { color: "#9ca3af", textAlign: "center", marginTop: 20 },
});