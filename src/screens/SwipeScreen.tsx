import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Animated,
    Modal,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import Card from '../components/Card';
import ActionButtons from '../components/ActionButtons';
import BottomNavigation from '../components/BottomNavigation';
import { CardData } from '../types';
import { useGmailAuth } from '../GmailAuthContext';
import { fetchGmailEmailsAsCards } from '../GmailApi';
import { awsApiService } from '../services/awsApi';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ColorPicker from '../components/ColorPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type RootStackParamList = {
    Swipe: undefined;
    Reply: { card: CardData };
};

// Fallback mock data
const mockEmails: CardData[] = [
    {
        id: '1',
        sender_name: 'John Smith',
        sender_email: 'john.smith@company.com',
        date_column: '2024-01-15',
        time_column: '09:30 AM',
        email_title: 'Project Update Meeting',
        email_summary: 'Hi team, I wanted to share the latest updates on our project progress. We have completed phase 1 and are ready to move forward with phase 2.',
        attachment_ct: 2
    },
    {
        id: '2',
        sender_name: 'Sarah Johnson',
        sender_email: 'sarah.j@startup.com',
        date_column: '2024-01-15',
        time_column: '10:15 AM',
        email_title: 'New Feature Request',
        email_summary: 'Hello! I have some exciting new feature ideas for our product. Would love to discuss these during our next meeting.',
        attachment_ct: 0
    }
];

const SwipeScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { accessToken, user, isLoading, signInWithGoogle, signOut, isMockMode } = useGmailAuth();
    
    const [cards, setCards] = useState<CardData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('home');
    const [showNewPage, setShowNewPage] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [currentEmail, setCurrentEmail] = useState('user@example.com');
    const [newLabelText, setNewLabelText] = useState('');
    const [forceRender, setForceRender] = useState(0);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null);
    const [isLoadingEmails, setIsLoadingEmails] = useState(false);

    // Label state initialization:
    const [labels, setLabels] = useState<{ name: string; color: string }[]>([{ name: 'R', color: '#4CAF50' }]);
    const [selectedLabel, setSelectedLabel] = useState<{ name: string; color: string } | null>(null);
    const [cardColor, setCardColor] = useState('#4CAF50');
    const [newLabelColor, setNewLabelColor] = useState('#4CAF50');
    const [cardLabelColors, setCardLabelColors] = useState<{ [cardId: string]: string }>({});
    const [cardLabels, setCardLabels] = useState<{ [cardId: string]: { name: string; color: string } }>({});

    const emailAccounts = [
        'user@example.com',
        'work@company.com',
        'personal@gmail.com',
        'business@startup.com'
    ];

    const slideAnim = useRef(new Animated.Value(0)).current;
    const newPageSlideAnim = useRef(new Animated.Value(0)).current;

    const categories = useMemo(() => {
        const categoryList = [
            'All',
            ...labels.map(label => label.name),
            'Add Label'
        ];
        return categoryList;
    }, [labels]);

    // Fetch emails from AWS backend when authenticated
    const fetchEmails = useCallback(async () => {
        if (!accessToken || !user) {
            console.log('❌ No access token or user, using mock data');
            setCards(mockEmails);
            return;
        }

        setIsLoadingEmails(true);
        try {
            console.log('🔍 Starting email fetch process...');
            console.log('📱 Platform:', Platform.OS);
            console.log('🔑 Access token exists:', !!accessToken);
            console.log('👤 User email:', user.email);
            
            // Always try to fetch fresh emails from Gmail API first
            console.log('📧 Fetching fresh emails from Gmail API...');
            console.log('🔑 Using access token for Gmail API call...');
            
            try {
                const gmailCards = await fetchGmailEmailsAsCards(accessToken, 20);
                console.log('✅ Successfully fetched emails from Gmail API:', gmailCards.length);
                setCards(gmailCards);
                
                // Store Gmail emails in AWS backend for caching
                try {
                    const gmailEmails = gmailCards.map(card => ({
                        id: card.id,
                        subject: card.email_title,
                        sender: card.sender_email,
                        snippet: card.email_summary,
                        date: new Date().toISOString(), // Use current date as fallback
                        labels: [],
                        isRead: false,
                        threadId: card.id
                    }));
                    await awsApiService.storeGmailEmails(user.email, gmailEmails);
                    console.log('✅ Stored Gmail emails in AWS backend for caching');
                } catch (storeError) {
                    console.error('❌ Error storing emails in AWS:', storeError);
                }
            } catch (gmailError: any) {
                console.error('❌ Error fetching from Gmail API:', gmailError);
                console.error('❌ Error details:', JSON.stringify(gmailError, null, 2));
                
                // If Gmail API fails, try to fetch from AWS backend as fallback
                console.log('🔄 Gmail API failed, trying AWS backend as fallback...');
                try {
                    const awsResponse = await awsApiService.fetchEmails(user.email, 20);
                    console.log('✅ Emails fetched from AWS backend:', awsResponse.emails.length);

                    if (awsResponse.emails && awsResponse.emails.length > 0) {
                        // Convert AWS email format to CardData format
                        const awsCards: CardData[] = awsResponse.emails.map(email => ({
                            id: email.id,
                            sender_name: email.sender.split('@')[0] || email.sender,
                            sender_email: email.sender,
                            date_column: new Date(email.date).toLocaleDateString(),
                            time_column: new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            email_title: email.subject,
                            email_summary: email.snippet,
                            attachment_ct: 0
                        }));
                        setCards(awsCards);
                        console.log('✅ Loaded emails from AWS backend:', awsCards.length);
                    } else {
                        throw new Error('No emails available in AWS backend');
                    }
                } catch (awsError) {
                    console.error('❌ AWS backend also failed:', awsError);
                    
                    // Show specific error message for Gmail API
                    if (gmailError.message?.includes('401')) {
                        Alert.alert(
                            'Authentication Error', 
                            'Gmail access token expired or invalid. Please sign in again.',
                            [
                                { text: 'OK', onPress: () => signOut() },
                                { text: 'Retry', onPress: () => fetchEmails() }
                            ]
                        );
                    } else if (gmailError.message?.includes('403')) {
                        Alert.alert(
                            'Permission Error', 
                            'Gmail API access denied. Please check your Gmail permissions.',
                            [
                                { text: 'OK', onPress: () => signOut() },
                                { text: 'Retry', onPress: () => fetchEmails() }
                            ]
                        );
                    } else {
                        Alert.alert(
                            'Email Fetch Error', 
                            `Failed to fetch emails from both Gmail API and AWS backend. Using mock data instead.`,
                            [
                                { text: 'Use Mock Data', onPress: () => setCards(mockEmails) },
                                { text: 'Retry', onPress: () => fetchEmails() }
                            ]
                        );
                        setCards(mockEmails);
                    }
                    return;
                }
            }
            setCurrentIndex(0);
        } catch (error) {
            console.error('❌ General error fetching emails:', error);
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
            Alert.alert('Error', 'Failed to fetch emails. Using mock data instead.');
            setCards(mockEmails);
        } finally {
            setIsLoadingEmails(false);
        }
    }, [accessToken, user]);

    // Load emails when access token changes
    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);

    const handleSwipe = useCallback((direction: 'left' | 'right') => {
        if (direction === 'right' && cards[currentIndex]) {
            navigation.navigate('Reply', { card: cards[currentIndex] });
        }
        setCurrentIndex(prev => prev + 1);
    }, [cards, currentIndex, navigation]);

    const handleSwipeLeft = useCallback(() => {
        handleSwipe('left');
    }, [handleSwipe]);

    const handleSwipeRight = useCallback(() => {
        handleSwipe('right');
    }, [handleSwipe]);

    const resetCards = useCallback(() => {
        setCurrentIndex(0);
        if (accessToken) {
            fetchEmails();
        } else {
            setCards(mockEmails);
        }
    }, [accessToken, fetchEmails]);

    const refreshEmails = useCallback(() => {
        console.log('🔄 Manual refresh triggered');
        if (accessToken) {
            fetchEmails();
        } else {
            Alert.alert('Not Signed In', 'Please sign in with Gmail to refresh emails.');
        }
    }, [accessToken, fetchEmails]);

    const handleCategoryPress = useCallback((category: string) => {
        if (category === 'Add Label') {
            setShowLabelModal(true);
        } else {
            setSelectedCategory(category);
        }
    }, []);

    // Filter emails based on search text and selected category
    const filteredEmails = useCallback(() => {
        let filtered = cards;

        // Filter by search text
        if (searchText.trim()) {
            filtered = filtered.filter(email =>
                email.email_title.toLowerCase().includes(searchText.toLowerCase()) ||
                email.email_title.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Filter by category (you can add category-specific filtering here)
        if (selectedCategory !== 'All') {
            // For now, just return all emails since we don't have category data
            // You can implement category filtering based on your data structure
        }

        return filtered;
    }, [searchText, selectedCategory, cards]);

    const handleTabPress = useCallback((tab: string) => {
        setActiveTab(tab);
    }, []);

    const handleComposePress = useCallback(() => {
        navigation.navigate('Compose');
    }, [navigation]);

    const handleReply = useCallback((card: CardData) => {
        console.log('SwipeScreen: handleReply called with card =', card);
        navigation.navigate('Reply', { card });
    }, [navigation]);

    const handleNavigationPress = useCallback(() => {
        console.log('Navigate to different page');

        // Animate the slide out
        Animated.timing(slideAnim, {
            toValue: -screenWidth,
            duration: 225,
            useNativeDriver: true,
        }).start(() => {
            setShowNewPage(true);
            // Reset animation value for next use
            slideAnim.setValue(0);
            console.log('Navigated to new page, labels state:', labels);
        });
    }, [slideAnim, labels]);

    const handleBackPress = useCallback(() => {
        // Animate the slide in from left
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 225,
            useNativeDriver: true,
        }).start(() => {
            setShowNewPage(false);
            // Reset animation value for next use
            slideAnim.setValue(0);
            console.log('Navigated back to main page, labels state:', labels);
        });
    }, [slideAnim, labels]);

    const handleNewPageNavigation = useCallback(() => {
        console.log('Navigate back to main page');

        // Animate the new page slide out to the left
        Animated.timing(newPageSlideAnim, {
            toValue: -screenWidth,
            duration: 225,
            useNativeDriver: true,
        }).start(() => {
            setShowNewPage(false);
            // Reset animation value for next use
            newPageSlideAnim.setValue(0);
        });
    }, [newPageSlideAnim]);

    const toggleDropdown = useCallback(() => {
        setShowDropdown(!showDropdown);
    }, [showDropdown]);

    const toggleAccountDropdown = useCallback(() => {
        setShowAccountDropdown(!showAccountDropdown);
    }, [showAccountDropdown]);

    const handleEmailSwitch = useCallback((email: string) => {
        setCurrentEmail(email);
        setShowAccountDropdown(false);
    }, []);

    const handleAddEmail = useCallback(() => {
        console.log('Add new email account');
        setShowAccountDropdown(false);
        // Here you would implement the logic to add a new email account
    }, []);

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            Alert.alert('Sign In Error', 'Failed to sign in with Google. Please try again.');
        }
    };

    const handleSignOut = () => {
        signOut();
        setCards(mockEmails);
        setCurrentIndex(0);
    };

    const handleLabelButtonPress = useCallback(() => {
        setShowLabelModal(true);
    }, []);

    const handleAddLabel = useCallback(() => {
        if (newLabelText.trim()) {
            const newLabel = { name: newLabelText.trim(), color: newLabelColor };
            setLabels(prev => [...prev, newLabel]);
            setNewLabelText('');
            setNewLabelColor('#4CAF50');
            // Close dropdown to force re-render
            setShowDropdown(false);
            // Force re-render of capsules
            setForceRender(prev => prev + 1);
            console.log('Label added:', newLabel, '- All components will update automatically');
        }
    }, [newLabelText, newLabelColor]);

    const handleDeleteLabel = useCallback((labelToDelete: string) => {
        setLabels(prev => {
            const updatedLabels = prev.filter(label => label.name !== labelToDelete);
            console.log('Labels updated after delete:', updatedLabels);
            return updatedLabels;
        });

        // If the deleted label was selected, reset to 'All'
        if (selectedCategory === labelToDelete) {
            setSelectedCategory('All');
            console.log('Selected category reset to "All" because deleted label was selected');
        }

        // Close dropdown to force re-render
        setShowDropdown(false);

        // Force re-render of capsules
        setForceRender(prev => prev + 1);

        console.log('Label deleted:', labelToDelete, '- All components will update automatically');
    }, [selectedCategory]);

    const resetLabels = useCallback(() => {
        setLabels(['R']);
        setSelectedCategory('All');
        setForceRender(prev => prev + 1);
        console.log('Labels reset to:', ['R']);
    }, []);

    // Implement handleLabelSelect:
    const handleLabelSelect = (label: { name: string; color: string }) => {
        setSelectedLabel(label);
        if (cards[currentIndex]) {
            const cardId = cards[currentIndex].id;
            setCardLabels(prev => {
                const updated = { ...prev, [cardId]: label };
                AsyncStorage.setItem('cardLabels', JSON.stringify(updated));
                // Persist to backend
                // createItem({ id: cardId, label: label.name, color: label.color }); // Removed backend call
                console.log('Label selected:', label, 'for cardId:', cardId, 'Updated mapping:', updated);
                return updated;
            });
        } else {
            console.log('No card at currentIndex', currentIndex);
        }
    };

    // Component mount effect
    useEffect(() => {
        console.log('Component mounted with initial labels:', labels);
    }, []);

    // On mount, load cardLabels from AsyncStorage
    useEffect(() => {
        AsyncStorage.getItem('cardLabels').then(data => {
            if (data) setCardLabels(JSON.parse(data));
        });
    }, []);

    // On mount, fetch items from DynamoDB via listItems and log the result to the console. Do not setCards yet—just print the data to verify the connection.
    useEffect(() => {
        async function fetchCards() {
            // const items = await listItems(); // Removed backend call
            // console.log('DynamoDB items:', items); // Removed backend call
        }
        fetchCards();
    }, []);

    // Close dropdown when labels change to force re-render
    useEffect(() => {
        setShowDropdown(false);
        console.log('Labels changed, current labels:', labels);
        console.log('Categories should now be:', ['All', ...labels.map(label => label.name)]);
    }, [labels]);

    // Show reset message when all cards are swiped
    if (currentIndex >= cards.length && !showNewPage) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No more cards!</Text>
                    <Text style={styles.emptySubtitle}>
                        You've swiped through all the emails.
                    </Text>
                    <TouchableOpacity style={styles.resetButton} onPress={resetCards}>
                        <Text style={styles.resetButtonText}>Start Over</Text>
                    </TouchableOpacity>
                </View>
                <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} onComposePress={handleComposePress} />
            </SafeAreaView>
        );
    }

    // Show new page
    if (showNewPage) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />

                {/* Animated New Page Content */}
                <Animated.View
                    style={[
                        styles.animatedContainer,
                        {
                            transform: [{ translateX: newPageSlideAnim }]
                        }
                    ]}
                >
                    {/* New Page Header */}
                    <View style={styles.header}>
                        {/* Email Account Switcher */}
                        <View style={styles.accountSwitcherContainer}>
                            <TouchableOpacity
                                style={styles.accountSwitcherButton}
                                onPress={toggleAccountDropdown}
                            >
                                <Text style={styles.accountEmail}>{currentEmail}</Text>
                                <Text style={styles.accountArrow}>{showAccountDropdown ? '▲' : '▼'}</Text>
                            </TouchableOpacity>

                            <Modal
                                visible={showAccountDropdown}
                                transparent={true}
                                animationType="fade"
                                onRequestClose={() => setShowAccountDropdown(false)}
                            >
                                <TouchableOpacity
                                    style={styles.modalOverlay}
                                    activeOpacity={1}
                                    onPress={() => setShowAccountDropdown(false)}
                                >
                                    <View style={styles.accountDropdownMenu}>
                                        {emailAccounts.map((email, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.accountDropdownItem,
                                                    currentEmail === email && styles.selectedAccountItem
                                                ]}
                                                onPress={() => handleEmailSwitch(email)}
                                            >
                                                <Text style={[
                                                    styles.accountDropdownText,
                                                    currentEmail === email && styles.selectedAccountText
                                                ]}>
                                                    {email}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                        <View style={styles.accountDropdownDivider} />
                                        <TouchableOpacity
                                            style={styles.addEmailButton}
                                            onPress={handleAddEmail}
                                        >
                                            <Text style={styles.addEmailText}>+ Add Email Account</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            </Modal>
                        </View>

                        <View style={styles.headerContent}>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>New Page</Text>
                                <Text style={styles.headerSubtitle}>Empty page for now</Text>
                            </View>
                            <View style={styles.headerButtonsContainer}>
                                <TouchableOpacity
                                    style={styles.navigationButton}
                                    onPress={handleNewPageNavigation}
                                >
                                    <Text style={styles.arrowIcon}>→</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Search and Dropdown Row */}
                    <View style={styles.searchDropdownRow}>
                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search emails..."
                                placeholderTextColor="#999"
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                            <Text style={styles.searchIcon}>🔍</Text>
                        </View>

                        {/* Dropdown Categories */}
                        <View style={styles.dropdownContainer} key={`dropdown-${labels.length}`}>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={toggleDropdown}
                            >
                                <Text style={styles.dropdownButtonText}>{selectedCategory}</Text>
                                <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
                            </TouchableOpacity>

                            <Modal
                                visible={showDropdown}
                                transparent={true}
                                animationType="fade"
                                onRequestClose={() => setShowDropdown(false)}
                            >
                                <TouchableOpacity
                                    style={styles.modalOverlay}
                                    activeOpacity={1}
                                    onPress={() => setShowDropdown(false)}
                                >
                                    <View style={styles.dropdownMenu}>
                                        {categories.map((category, index) => {
                                            console.log('Rendering dropdown category:', category);
                                            return (
                                                <TouchableOpacity
                                                    key={`${category}-${index}`}
                                                    style={[
                                                        styles.dropdownItem,
                                                        selectedCategory === category && styles.selectedDropdownItem
                                                    ]}
                                                    onPress={() => {
                                                        if (category === 'Add Label') {
                                                            setShowLabelModal(true);
                                                            setShowDropdown(false);
                                                        } else {
                                                            handleCategoryPress(category);
                                                            setShowDropdown(false);
                                                        }
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.dropdownItemText,
                                                        selectedCategory === category && styles.selectedDropdownItemText
                                                    ]}>
                                                        {category}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </TouchableOpacity>
                            </Modal>
                        </View>
                    </View>

                    {/* Email Application Interface */}
                    <View style={styles.emailAppContainer}>
                        {/* Email List */}
                        <View style={styles.emailListContainer}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {filteredEmails().length > 0 ? (
                                    filteredEmails().map((email, index) => (
                                        <TouchableOpacity
                                            key={email.id}
                                            style={styles.emailItem}
                                            onPress={() => console.log('Email clicked:', email.email_title)}
                                        >
                                            <View style={styles.emailItemHeader}>
                                                <Text style={styles.emailSender}>{email.email_title}</Text>
                                                <Text style={styles.emailTime}>9:4{index + 1}</Text>
                                            </View>
                                            <Text style={styles.emailSubject}>{email.email_title} - Important Update</Text>
                                            <Text style={styles.emailPreview}>
                                                This is a preview of the email content. Click to read more...
                                            </Text>
                                            <View style={styles.emailItemFooter}>
                                                <View style={styles.emailBadge}>
                                                    <Text style={styles.emailBadgeText}>New</Text>
                                                </View>
                                                <View style={styles.emailActions}>
                                                    <TouchableOpacity style={styles.emailActionButton}>
                                                        <Text style={styles.emailActionIcon}>📎</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.emailActionButton}>
                                                        <Text style={styles.emailActionIcon}>⭐</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>
                                            {searchText.trim() ? 'No emails found matching your search.' : 'No emails available.'}
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Animated.View>

                {/* Bottom Navigation - Locked */}
                <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} onComposePress={handleComposePress} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Animated Content */}
            <Animated.View
                style={[
                    styles.animatedContainer,
                    {
                        transform: [{ translateX: slideAnim }]
                    }
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    {/* Gmail Sign In Button */}
                    {!accessToken && (
                        <TouchableOpacity
                            style={styles.gmailSignInButton}
                            onPress={handleSignIn}
                            disabled={isLoading}
                        >
                            <Text style={styles.gmailSignInText}>
                                {isLoading ? 'Signing in...' : 'Sign in with Gmail'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    
                                                    {/* User Info Display */}
                                {accessToken && user && (
                                    <View style={styles.userInfoContainer}>
                                        <Text style={styles.userInfoText}>
                                            Signed in as: {user.email}
                                            {isMockMode && (
                                                <Text style={styles.mockModeText}> (Demo Mode)</Text>
                                            )}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.signOutButton}
                                            onPress={handleSignOut}
                                        >
                                            <Text style={styles.signOutText}>Sign Out</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                    
                    {/* Email Account Switcher */}
                    <View style={styles.accountSwitcherContainer}>
                        <TouchableOpacity
                            style={styles.accountSwitcherButton}
                            onPress={toggleAccountDropdown}
                        >
                            <Text style={styles.accountEmail}>{currentEmail}</Text>
                            <Text style={styles.accountArrow}>{showAccountDropdown ? '▲' : '▼'}</Text>
                        </TouchableOpacity>

                        <Modal
                            visible={showAccountDropdown}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setShowAccountDropdown(false)}
                        >
                            <TouchableOpacity
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPress={() => setShowAccountDropdown(false)}
                            >
                                <View style={styles.accountDropdownMenu}>
                                    {emailAccounts.map((email, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.accountDropdownItem,
                                                currentEmail === email && styles.selectedAccountItem
                                            ]}
                                            onPress={() => handleEmailSwitch(email)}
                                        >
                                            <Text style={[
                                                styles.accountDropdownText,
                                                currentEmail === email && styles.selectedAccountText
                                            ]}>
                                                {email}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                    <View style={styles.accountDropdownDivider} />
                                    <TouchableOpacity
                                        style={styles.addEmailButton}
                                        onPress={handleAddEmail}
                                    >
                                        <Text style={styles.addEmailText}>+ Add Email Account</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    </View>

                    <View style={styles.headerContent}>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Email Swipe</Text>
                            <Text style={styles.headerSubtitle}>
                                {currentIndex + 1} of {cards.length}
                            </Text>
                        </View>
                        <View style={styles.headerButtonsContainer}>
                            {accessToken && (
                                <TouchableOpacity
                                    style={styles.refreshButton}
                                    onPress={refreshEmails}
                                    disabled={isLoadingEmails}
                                >
                                    <Text style={styles.refreshButtonText}>
                                        {isLoadingEmails ? '🔄' : '🔄'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.labelButton}
                                onPress={handleLabelButtonPress}
                            >
                                <Text style={styles.labelButtonText}>Label</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.navigationButton}
                                onPress={handleNavigationPress}
                            >
                                <Text style={styles.arrowIcon}>→</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Horizontal Scrollable Categories */}
                <View style={styles.categoriesContainer} key={`categories-${labels.length}-${forceRender}`}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesScrollContainer}
                    >
                        {labels.map((label, index) => (
                            <TouchableOpacity
                                key={label.name}
                                style={[styles.labelCapsule, { backgroundColor: label.color }]}
                                onPress={() => handleLabelSelect(label)}
                            >
                                <Text style={styles.labelCapsuleText}>{label.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Cards Container */}
                <View style={styles.cardsContainer}>
                    {Array.isArray(cards) && cards.length > 0 ? (
                        cards.slice(currentIndex, currentIndex + 3).map((card, index) => {
                            const label = cardLabels[card.id];
                            const color = label ? label.color : '#4CAF50';
                            console.log('Rendering card', card.id, 'with color', color, 'and label', label);
                            return (
                                <Card
                                    key={card.id}
                                    card={card}
                                    isTop={index === 0}
                                    onSwipe={handleSwipe}
                                    onReply={handleReply}
                                    cardColor={color}
                                    labelName={label ? label.name : undefined}
                                />
                            );
                        })
                    ) : (
                        <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>No cards available.</Text>
                    )}
                </View>

                {/* Action Buttons */}
                <ActionButtons
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                />
            </Animated.View>

            {/* Bottom Navigation - Locked */}
            <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} onComposePress={handleComposePress} />

            {/* Label Modal */}
            <Modal
                visible={showLabelModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLabelModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLabelModal(false)}
                >
                    <View style={styles.labelModalContainer}>
                        <View style={styles.labelModalHeader}>
                            <Text style={styles.labelModalTitle}>Manage Labels</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowLabelModal(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.addLabelContainer}>
                            <TouchableOpacity style={styles.colorPreview} onPress={() => setShowColorPicker(v => !v)}>
                                <View style={[styles.colorCircle, { backgroundColor: newLabelColor }]} />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.addLabelInput}
                                placeholder="new label name..."
                                placeholderTextColor="#999"
                                value={newLabelText}
                                onChangeText={setNewLabelText}
                            />
                            <TouchableOpacity
                                style={styles.addLabelButton}
                                onPress={() => {
                                    if (editingLabelIndex !== null) {
                                        // Save edit
                                        setLabels(prev => prev.map((l, i) => i === editingLabelIndex ? { name: newLabelText, color: newLabelColor } : l));
                                        setEditingLabelIndex(null);
                                    } else {
                                        handleAddLabel();
                                    }
                                    setNewLabelText('');
                                    setNewLabelColor('#4CAF50');
                                    setShowColorPicker(false);
                                }}
                            >
                                <Text style={styles.addLabelButtonText}>{editingLabelIndex !== null ? 'Save' : 'Add'}</Text>
                            </TouchableOpacity>
                        </View>
                        {showColorPicker && (
                            <ColorPicker
                                color={newLabelColor}
                                onChange={setNewLabelColor}
                                style={{ width: 200, height: 200, alignSelf: 'center', marginVertical: 8 }}
                            />
                        )}

                        <ScrollView style={styles.labelsList}>
                            {labels.map((label, index) => (
                                <View key={index} style={styles.labelItem}>
                                    <TouchableOpacity
                                        style={[styles.labelCapsule, { backgroundColor: label.color }]}
                                        onPress={() => handleLabelSelect(label)}
                                    >
                                        <Text style={styles.labelItemText}>{label.name}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.editLabelButton}
                                        onPress={() => {
                                            setNewLabelText(label.name);
                                            setNewLabelColor(label.color);
                                            setShowColorPicker(false);
                                            setEditingLabelIndex(index);
                                        }}
                                    >
                                        <Text style={styles.editLabelText}>✏️</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteLabelButton}
                                        onPress={() => handleDeleteLabel(label.name)}
                                    >
                                        <Text style={styles.deleteLabelText}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    animatedContainer: {
        flex: 1,
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    accountSwitcherContainer: {
        marginBottom: 15,
    },
    accountSwitcherButton: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignSelf: 'flex-start',
        minWidth: 200,
    },
    accountEmail: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4CAF50',
    },
    accountArrow: {
        fontSize: 12,
        color: '#4CAF50',
    },
    accountDropdownMenu: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingVertical: 10,
        paddingHorizontal: 5,
        minWidth: 250,
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    accountDropdownItem: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginHorizontal: 5,
        marginVertical: 2,
    },
    selectedAccountItem: {
        backgroundColor: '#4CAF50',
    },
    accountDropdownText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'left',
    },
    selectedAccountText: {
        color: 'white',
        fontWeight: 'bold',
    },
    accountDropdownDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 8,
        marginHorizontal: 10,
    },
    addEmailButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginHorizontal: 5,
        marginVertical: 2,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    addEmailText: {
        fontSize: 14,
        color: '#4CAF50',
        textAlign: 'center',
        fontWeight: '500',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    labelButton: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    labelButtonText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '500',
    },
    headerTextContainer: {
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    navigationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    arrowIcon: {
        fontSize: 20,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    backIcon: {
        fontSize: 20,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    placeholder: {
        width: 40,
    },
    categoriesContainer: {
        paddingVertical: 15,
        paddingHorizontal: 10,
    },
    categoriesScrollContainer: {
        paddingHorizontal: 10,
    },
    categoryCircle: {
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        minWidth: 80,
        alignItems: 'center',
    },
    selectedCategoryCircle: {
        backgroundColor: '#4CAF50',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    selectedCategoryText: {
        color: 'white',
    },
    cardsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    newPageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    newPageText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    newPageSubtext: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    emailAppContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    emailListContainer: {
        flex: 1,
        paddingHorizontal: 15,
    },
    emailItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginVertical: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    emailItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    emailSender: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    emailTime: {
        fontSize: 14,
        color: '#666',
    },
    emailSubject: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    emailPreview: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    emailItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    emailBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    emailBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emailActions: {
        flexDirection: 'row',
        gap: 8,
    },
    emailActionButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emailActionIcon: {
        fontSize: 14,
    },
    searchDropdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        gap: 15,
    },
    searchContainer: {
        flex: 1,
        position: 'relative',
    },
    searchInput: {
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 12,
        paddingRight: 45,
        fontSize: 16,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    searchIcon: {
        position: 'absolute',
        right: 15,
        top: 12,
        fontSize: 16,
        color: '#999',
    },
    dropdownContainer: {
        paddingVertical: 0,
        paddingHorizontal: 0,
    },
    dropdownButton: {
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        alignSelf: 'center',
        minWidth: 120,
    },
    dropdownButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    dropdownArrow: {
        fontSize: 14,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 100,
    },
    dropdownMenu: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingVertical: 10,
        paddingHorizontal: 5,
        minWidth: 150,
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    dropdownItem: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginHorizontal: 5,
        marginVertical: 2,
    },
    selectedDropdownItem: {
        backgroundColor: '#4CAF50',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    selectedDropdownItemText: {
        color: 'white',
        fontWeight: 'bold',
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    noResultsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    resetButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    resetButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    labelModalContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '90%',
        maxWidth: 400,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    labelModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    labelModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#666',
    },
    resetLabelsButton: {
        backgroundColor: '#FF5252',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    resetLabelsButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    addLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    addLabelInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 0,
    },
    addLabelButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    addLabelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    labelsList: {
        maxHeight: 250,
    },
    labelItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    labelItemText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    deleteLabelButton: {
        padding: 5,
    },
    deleteLabelText: {
        fontSize: 18,
        color: '#FF5252',
    },
    colorPreview: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4CAF50',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    labelCapsule: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 5,
        marginVertical: 2,
        alignItems: 'center',
    },
    labelCapsuleText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'white',
    },
    pickColorButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        marginTop: 5,
    },
    pickColorButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    editLabelButton: {
        padding: 5,
    },
    editLabelText: {
        fontSize: 18,
        color: '#4CAF50',
    },
    // Gmail Sign In Button Styles
    gmailSignInButton: {
        backgroundColor: '#4285F4',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    gmailSignInText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    userInfoContainer: {
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfoText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '500',
    },
    signOutButton: {
        backgroundColor: '#FF5252',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    signOutText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    mockModeText: {
        color: '#FFA500',
        fontSize: 12,
        fontStyle: 'italic',
    },
    refreshButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    refreshButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SwipeScreen; 