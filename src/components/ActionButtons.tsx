import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ActionButtonsProps {
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    onSwipeLeft,
    onSwipeRight,
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={onSwipeRight}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>Read</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={onSwipeRight}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>Unsubscribe</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={onSwipeLeft}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={onSwipeLeft}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>Block</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        width: '100%',
    },
    button: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ActionButtons; 