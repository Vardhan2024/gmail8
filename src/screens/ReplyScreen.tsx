import React, { useState } from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback, Dimensions, TouchableOpacity, Platform, KeyboardAvoidingView, Alert, TextInput } from 'react-native';
import { CardData } from '../types';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useGmailAuth } from '../GmailAuthContext';
import { sendGmailEmail, SendEmailRequest } from '../GmailApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ReplyScreenProps {
    route: { params: { card: CardData } };
}

const ReplyScreen: React.FC<ReplyScreenProps> = ({ route }) => {
    // Add debugging and error handling
    console.log('ReplyScreen: route.params =', route.params);
    
    if (!route.params || !route.params.card) {
        console.error('ReplyScreen: No card data provided in route params');
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, color: '#333', textAlign: 'center' }}>
                    Error: No email data found.{'\n'}
                    Please go back and try again.
                </Text>
                <TouchableOpacity 
                    style={{ marginTop: 20, padding: 15, backgroundColor: '#4CAF50', borderRadius: 8 }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }
    
    const { card } = route.params;
    console.log('ReplyScreen: card data =', card);
    
    const [reply, setReply] = useState('');
    const [attachment, setAttachment] = useState<{ name: string } | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const navigation = useNavigation();
    const { accessToken, isMockMode } = useGmailAuth();

    const handleSend = async () => {
        if (!reply.trim()) {
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
                setIsSent(true);
                setTimeout(() => {
                    setIsSent(false);
                    navigation.goBack();
                }, 2000);
            } else {
                // Real Gmail API send
                const emailData: SendEmailRequest = {
                    to: card.sender_email,
                    subject: `Re: ${card.email_title}`,
                    body: reply,
                    threadId: card.id, // Use card ID as thread ID for replies
                    inReplyTo: card.id // Reference the original message
                };

                const result = await sendGmailEmail(accessToken!, emailData);
                console.log('Email sent successfully:', result);
                
                setIsSent(true);
                setTimeout(() => {
                    setIsSent(false);
                    navigation.goBack();
                }, 2000);
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

    // Removed font change functionality for simplicity

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}
            >
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>{'< Back'}</Text>
                    </TouchableOpacity>
                    
                    {/* Reply Message */}
                    <View style={styles.replyContainer}>
                        <Text style={styles.replyLabel}>Your Reply:</Text>
                        <TextInput
                            style={styles.replyInput}
                            value={reply}
                            onChangeText={setReply}
                            placeholder="Type your reply..."
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
                            <TouchableOpacity 
                                style={[styles.sendButton, (isSending || isSent) && styles.sendButtonDisabled]} 
                                onPress={handleSend}
                                disabled={isSending || isSent}
                            >
                                <Text style={styles.sendButtonText}>
                                    {isSending ? 'Sending...' : isSent ? 'Sent!' : 'Send'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Email Details Card below */}
                    <View style={styles.emailCard}>
                        <Text style={styles.senderName}>{card.sender_name}</Text>
                        <Text style={styles.senderEmail}>{`<${card.sender_email}>`}</Text>
                        <View style={styles.row}>
                            <Text style={styles.date}>{card.date_column}</Text>
                            <Text style={styles.time}>{card.time_column}</Text>
                        </View>
                        <Text style={styles.subject}>{card.email_title}</Text>
                        <Text style={styles.summary}>{card.email_summary}</Text>
                        <Text style={styles.type}>Type - Spam</Text>
                    </View>

                    {/* Sent Popup */}
                    {isSent && (
                        <View style={styles.sentPopup}>
                            <View style={styles.sentPopupContent}>
                                <Text style={styles.sentPopupIcon}>✅</Text>
                                <Text style={styles.sentPopupText}>Email Sent Successfully!</Text>
                            </View>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingTop: 32,
    },
    replyContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 32,
    },
    replyLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        alignSelf: 'flex-start',
        marginLeft: screenWidth * 0.05,
    },
    replyInput: {
        width: screenWidth * 0.9,
        backgroundColor: '#E5F5E2',
        borderRadius: 20,
        padding: 18,
        marginBottom: 24,
        minHeight: 200,
        fontSize: 16,
        color: '#222',
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    backButton: {
        position: 'absolute',
        top: 18,
        left: 18,
        zIndex: 10,
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
    // Removed unused rich editor styles
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    sendButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 16,
        alignSelf: 'flex-end',
        paddingHorizontal: 24,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    attachmentText: {
        color: '#388E3C',
        fontSize: 15,
        marginTop: 8,
        marginBottom: 0,
    },
    emailCard: {
        width: screenWidth * 0.9,
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        padding: 18,
        marginBottom: 24,
        marginTop: 32,
    },
    senderName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 2,
    },
    senderEmail: {
        color: '#e0ffe0',
        fontSize: 13,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    date: {
        color: '#b2ffb2',
        fontSize: 13,
    },
    time: {
        color: '#b2ffb2',
        fontSize: 13,
    },
    subject: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 6,
    },
    summary: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
    },
    type: {
        color: '#e0ffe0',
        fontSize: 13,
        marginTop: 4,
    },
    sentPopup: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    sentPopupContent: {
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    sentPopupIcon: {
        fontSize: 48,
        marginBottom: 15,
    },
    sentPopupText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default ReplyScreen; 