import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function LedgerCalculator() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("1.5");

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [result, setResult] = useState(null);
  const [savedLedgers, setSavedLedgers] = useState([]);

  useEffect(() => {
    loadLedgers();
  }, []);

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const calculate = () => {
    let diffDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

    let years = Math.floor(diffDays / 365);
    let remainingDays = diffDays % 365;
    let months = Math.floor(remainingDays / 30);
    let days = remainingDays % 30;

    let balance = Number(principal);
    let monthlyRate = Number(rate) / 100;
    let yearlyRate = monthlyRate * 12;

    // yearly compounding
    for (let i = 0; i < years; i++) {
      balance += balance * yearlyRate;
    }

    // monthly simple interest
    balance += balance * monthlyRate * months;

    // daily simple interest
    let dailyRate = monthlyRate / 30;
    balance += balance * dailyRate * days;

    setResult({
      final: balance.toFixed(0),
      interest: (balance - Number(principal)).toFixed(0),
      breakdown: `${years}Y ${months}M ${days}D`,
    });
  };

  const saveLedger = async () => {
    const newEntry = {
      principal,
      rate,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      result,
    };
    const updated = [newEntry, ...savedLedgers];
    setSavedLedgers(updated);
    await AsyncStorage.setItem("ledgers", JSON.stringify(updated));
  };

  const loadLedgers = async () => {
    const data = await AsyncStorage.getItem("ledgers");
    if (data) setSavedLedgers(JSON.parse(data));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ledger Pro</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Principal (₹)"
          keyboardType="numeric"
          value={principal}
          onChangeText={setPrincipal}
        />

        <TextInput
          style={styles.input}
          placeholder="Monthly Rate (%)"
          keyboardType="numeric"
          value={rate}
          onChangeText={setRate}
        />

        <Pressable style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
          <Text>Start: {formatDate(startDate)}</Text>
        </Pressable>

        <Pressable style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
          <Text>End: {formatDate(endDate)}</Text>
        </Pressable>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "android" ? "default" : "spinner"}
            onChange={(e, d) => {
              setShowStartPicker(false);
              if (d) setStartDate(d);
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === "android" ? "default" : "spinner"}
            onChange={(e, d) => {
              setShowEndPicker(false);
              if (d) setEndDate(d);
            }}
          />
        )}

        <Pressable style={styles.btn} onPress={calculate}>
          <Text style={styles.btnText}>Calculate</Text>
        </Pressable>

        {result && (
          <View style={styles.resultBox}>
            <Text>Duration: {result.breakdown}</Text>
            <Text style={styles.result}>₹{result.final}</Text>
            <Text>Interest: ₹{result.interest}</Text>

            <Pressable style={styles.saveBtn} onPress={saveLedger}>
              <Text style={styles.btnText}>Save Ledger</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text style={styles.subtitle}>Saved Ledgers</Text>

      {savedLedgers.map((item, index) => (
        <View key={index} style={styles.ledgerItem}>
          <Text style={{ fontWeight: "600" }}>
            ₹{item.principal} → ₹{item.result?.final}
          </Text>
          <Text>
            {item.startDate} → {item.endDate}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f5f7fb" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  dateBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    marginBottom: 10,
  },

  btn: {
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },

  saveBtn: {
    backgroundColor: "#16a34a",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  btnText: { color: "#fff", fontWeight: "600" },

  resultBox: { marginTop: 15 },
  result: { fontSize: 20, fontWeight: "bold" },

  subtitle: { marginTop: 20, fontWeight: "bold", fontSize: 16 },

  ledgerItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
});
