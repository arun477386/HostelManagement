import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity 
        style={styles.faqQuestion} 
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.faqQuestionText}>{question}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-down" : "chevron-forward"} 
          size={20} 
          color="#606770" 
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

export default function HelpSupportScreen() {
  const faqs = [
    {
      question: "How do I add a new hostel?",
      answer: "To add a new hostel, go to the Hostels tab and tap the '+' button. Fill in the hostel details including name, address, and room configuration. You can add rooms and set their sharing types after creating the hostel."
    },
    {
      question: "How do I add students to rooms?",
      answer: "Navigate to the Students tab, tap 'Add Student', and fill in the student's details. Then select the hostel and room where you want to assign them. You can also move students between rooms from the Students list."
    },
    {
      question: "How is monthly collection calculated?",
      answer: "Monthly collection is calculated based on the room sharing type and the monthly fee set for each room. The system automatically calculates the total amount due for each student based on their room assignment and the number of days in the month."
    },
    {
      question: "What happens if I delete a student?",
      answer: "When you delete a student, their record is removed from the system. Any pending payments will be marked as cancelled. The room they occupied will be marked as available for new students."
    }
  ];

  const handleEmail = () => {
    Linking.openURL('mailto:support@hostelease.com');
  };

  const handleCall = () => {
    Linking.openURL('tel:+1234567890');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Link href="/(tabs)/profile" style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Link>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Need More Help?</Text>
          <Text style={styles.contactSubtitle}>We're here to assist you 24/7</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
              <Ionicons name="mail-outline" size={24} color="white" />
              <Text style={styles.buttonText}>Email Us</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <Ionicons name="call-outline" size={24} color="white" />
              <Text style={styles.buttonText}>Call Us</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>© 2025 HostelEase. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B9EFF',
    padding: 12,
    borderRadius: 8,
    height: 48,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerText: {
    textAlign: 'center',
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 20,
  },
}); 