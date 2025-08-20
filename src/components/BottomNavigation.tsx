import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Text,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface BottomNavigationProps {
    activeTab: string;
    onTabPress: (tab: string) => void;
    onComposePress?: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
    activeTab,
    onTabPress,
    onComposePress,
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'home' && styles.activeTab]}
                onPress={() => onTabPress('home')}
            >
                <Text style={[styles.iconText, activeTab === 'home' && styles.activeIconText]}>
                    🏠
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'star' && styles.activeTab]}
                onPress={() => onTabPress('star')}
            >
                <Text style={[styles.iconText, activeTab === 'star' && styles.activeIconText]}>
                    ⭐
                </Text>
            </TouchableOpacity>

            {/* Compose Button */}
            <TouchableOpacity
                style={styles.composeButton}
                onPress={onComposePress}
            >
                <Text style={styles.composeIconText}>
                    ✏️
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'infinity' && styles.activeTab]}
                onPress={() => onTabPress('infinity')}
            >
                <Text style={[styles.iconText, activeTab === 'infinity' && styles.activeIconText]}>
                    ∞
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
                onPress={() => onTabPress('profile')}
            >
                <Text style={[styles.iconText, activeTab === 'profile' && styles.activeIconText]}>
                    👤
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(229, 245, 226, 0.5)', // #E5F5E2 with 50% opacity
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
    },
    tab: {
        padding: 10,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    composeButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    iconText: {
        fontSize: 24,
        color: '#333',
    },
    activeIconText: {
        color: '#4CAF50',
    },
    composeIconText: {
        fontSize: 20,
        color: '#fff',
    },
});

export default BottomNavigation; 