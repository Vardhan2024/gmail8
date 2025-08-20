import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Keyboard, 
    Dimensions, 
    TouchableOpacity, 
    Platform, 
    KeyboardAvoidingView, 
    Alert,
    TextInput 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useGmailAuth } from '../GmailAuthContext';
import { sendGmailEmail, SendEmailRequest } from '../GmailApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ComposeScreen: React.FC = () => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachment, setAttachment] = useState<{ name: string } | null>(null);
    const [isSending, setIsSending] = useState(false);
    const navigation = useNavigation();
    const { accessToken, isMockMode } = useGmailAuth();

    const handleSend = async () => {
        if (!to.trim()) {
            Alert.alert('Error', 'Please enter a recipient email address.');
            return;
        }

        if (!subject.trim()) {
            Alert.alert('Error', 'Please enter a subject.');
            return;
        }

        if (!body.trim()) {
            Alert.alert('Error', 'Please enter a message before sending.');
            return;
        }

        if (!accessToken && !isMockMode) {
            Alert.alert('Error', 'You need to be authenticated to send emails.');
            return;
        }

        setIsSending(true);
        try {
            if (isMockMode) {
                // Mock send for demo mode
                await new Promise(resolve => setTimeout(resolve, 1000));
                Alert.alert('Success', 'Email sent successfully! (Demo Mode)', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                // Real Gmail API send
                const emailData: SendEmailRequest = {
                    to: to.trim(),
                    subject: subject.trim(),
                    body: body,
                };

                const result = await sendGmailEmail(accessToken!, emailData);
                console.log('Email sent successfully:', result);
                
                Alert.alert('Success', 'Email sent successfully! It will appear in your Sent folder.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            Alert.alert('Error', `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleAttach = async () => {
        const result = await DocumentPicker.getDocumentAsync({});
        if (result.type === 'success') {
            setAttachment({ name: result.name });
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>{'< Cancel'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Message</Text>
                    <TouchableOpacity 
                        style={[styles.sendButton, isSending && styles.sendButtonDisabled]} 
                        onPress={handleSend}
                        disabled={isSending}
                    >
                        <Text style={styles.sendButtonText}>
                            {isSending ? 'Sending...' : 'Send'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Email Fields */}
                <View style={styles.emailFields}>
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>To:</Text>
                        <TextInput
                            style={styles.textInput}
                            value={to}
                            onChangeText={setTo}
                            placeholder="Enter email address"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Subject:</Text>
                        <TextInput
                            style={styles.textInput}
                            value={subject}
                            onChangeText={setSubject}
                            placeholder="Enter subject"
                        />
                    </View>
                </View>

                {/* Message Body */}
                <View style={styles.messageBodyContainer}>
                    <Text style={styles.messageLabel}>Message:</Text>
                    <TextInput
                        style={styles.messageInput}
                        value={body}
                        onChangeText={setBody}
                        placeholder="Type your message..."
                        multiline
                        textAlignVertical="top"
                        numberOfLines={8}
                    />
                    {attachment && (
                        <Text style={styles.attachmentText}>📎 {attachment.name}</Text>
                    )}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.attachButton} onPress={handleAttach}>
                            <Text style={styles.attachButtonText}>Attach</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    backButtonText: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    sendButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    emailFields: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    fieldContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    fieldLabel: {
        width: 60,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    textInput: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingVertical: 8,
        fontSize: 16,
    },
    messageBodyContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    messageLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    messageInput: {
        flex: 1,
        backgroundColor: '#E5F5E2',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#222',
        textAlignVertical: 'top',
        minHeight: 200,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 12,
    },
    attachButton: {
        backgroundColor: '#E5F5E2',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    attachButtonText: {
        color: '#388E3C',
        fontWeight: 'bold',
        fontSize: 16,
    },
    attachmentText: {
        color: '#388E3C',
        fontSize: 15,
        marginTop: 8,
        marginBottom: 0,
    },
});

export default ComposeScreen;
