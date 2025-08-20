import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { CardData } from '../types';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolate, Extrapolate, runOnJS } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;

interface CardProps {
    card: CardData;
    isTop: boolean;
    onSwipe: (direction: 'left' | 'right') => void;
    onReply?: (card: CardData) => void; // Add onReply prop
    cardColor?: string; // Add cardColor prop
    labelName?: string; // Add labelName prop
}

// CardHeader subcomponent
function CardHeader({ sender_name, sender_email, date_column, time_column, onLogoPress }: {
    sender_name: string;
    sender_email: string;
    date_column: string;
    time_column: string;
    onLogoPress: () => void;
}) {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.logoButton}
                onPress={onLogoPress}
                activeOpacity={0.7}
            >
                <Text style={styles.logoText}>{sender_name}</Text>
            </TouchableOpacity>
            <Text style={styles.emailAddress}>{`<${sender_email}>`}</Text>
            <View style={styles.dateTimeContainer}>
                <Text style={styles.date}>{date_column}</Text>
                <Text style={styles.time}>{time_column}</Text>
            </View>
            <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => console.log('Attachment clicked:', sender_name)}
                activeOpacity={0.7}
            >
                <Text style={styles.attachmentIcon}>📎</Text>
            </TouchableOpacity>
        </View>
    );
}

// CardBody subcomponent
function CardBody({ email_title, email_summary }: {
    email_title: string;
    email_summary: string;
}) {
    return (
        <ScrollView
            style={styles.bodyContainer}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.subject}>{email_title}</Text>
            <Text style={styles.bodyText}>{email_summary}</Text>
        </ScrollView>
    );
}

// CardFooter subcomponent
function CardFooter({ attachment_ct, onReply }: { 
    attachment_ct: number; 
    onReply?: () => void;
}) {
    return (
        <View style={styles.footer}>
            <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
            </View>
            
            {/* Reply Button */}
            {onReply && (
                <TouchableOpacity
                    style={styles.replyButton}
                    onPress={onReply}
                    activeOpacity={0.8}
                >
                    <Text style={styles.replyButtonText}>💬 Reply</Text>
                </TouchableOpacity>
            )}
            
            {/* Attachment count capsule */}
            <View style={styles.attachmentCountCapsule}>
                <Text style={styles.attachmentCountText}>📎 {attachment_ct}</Text>
            </View>
        </View>
    );
}

const Card: React.FC<CardProps> = ({ card, isTop, onSwipe, onReply, cardColor, labelName }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotateZ = useSharedValue(0);
    const isAnimating = useSharedValue(false);
    const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;
    const mounted = useRef(true);
    useEffect(() => {
        return () => { mounted.current = false; };
    }, []);

    const handleAdvance = (direction: 'left' | 'right') => {
        if (!mounted.current) return;
        onSwipe(direction);
    };

    const handleReply = () => {
        if (onReply) {
            onReply(card);
        }
    };

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY;
            rotateZ.value = interpolate(
                e.translationX,
                [-200, 0, 200],
                [-12, 0, 12],
                Extrapolate.CLAMP
            );
        })
        .onEnd(() => {
            const shouldLeft = translateX.value < -SWIPE_THRESHOLD;
            const shouldRight = translateX.value > SWIPE_THRESHOLD;
            if (!shouldLeft && !shouldRight) {
                translateX.value = withSpring(0, { damping: 18, stiffness: 160 });
                translateY.value = withSpring(0, { damping: 18, stiffness: 160 });
                rotateZ.value = withSpring(0, { damping: 18, stiffness: 160 });
                return;
            }
            const dir = shouldRight ? 'right' : 'left';
            const exitX = shouldRight ? screenWidth * 1.25 : -screenWidth * 1.25;
            isAnimating.value = true;
            translateX.value = withTiming(exitX, { duration: 220 }, (finished) => {
                if (finished) {
                    isAnimating.value = false;
                    runOnJS(handleAdvance)(dir);
                }
            });
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotateZ: `${rotateZ.value}deg` },
        ],
    }));

    const handleLogoPress = () => {
        console.log('Logo clicked:', card.sender_name);
        // Add your logo click functionality here
    };

    if (!isTop) {
        return (
            <View style={[styles.card, styles.nonTopCard, cardColor ? { backgroundColor: cardColor } : null]} pointerEvents="none">
                {/* Show labelName as a capsule if provided */}
                {labelName && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, margin: 8 }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{labelName}</Text>
                    </View>
                )}
                <CardHeader
                    sender_name={card.sender_name}
                    sender_email={card.sender_email}
                    date_column={card.date_column}
                    time_column={card.time_column}
                    onLogoPress={handleLogoPress}
                />
                <CardBody
                    email_title={card.email_title}
                    email_summary={card.email_summary}
                />
                <CardFooter attachment_ct={card.attachment_ct} onReply={handleReply} />
            </View>
        );
    }

    // Top card is swipeable
    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.card, animatedStyle, cardColor ? { backgroundColor: cardColor } : null]}>
                {/* Show labelName as a capsule if provided */}
                {labelName && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, margin: 8 }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{labelName}</Text>
                    </View>
                )}
                <CardHeader
                    sender_name={card.sender_name}
                    sender_email={card.sender_email}
                    date_column={card.date_column}
                    time_column={card.time_column}
                    onLogoPress={handleLogoPress}
                />
                <CardBody
                    email_title={card.email_title}
                    email_summary={card.email_summary}
                />
                <CardFooter attachment_ct={card.attachment_ct} onReply={handleReply} />
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        width: screenWidth * 0.9,
        height: screenHeight * 0.476, // Reduced from 0.56 to 0.476 (15% smaller)
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden',
    },
    nonTopCard: {
        opacity: 0,
        transform: [{ scale: 1 }],
    },
    header: {
        backgroundColor: '#2E7D32',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'relative',
    },
    logoButton: {
        alignSelf: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 5,
    },
    logoText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    attachmentButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    attachmentIcon: {
        fontSize: 16,
        color: '#2E7D32',
    },
    emailAddress: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    date: {
        color: 'white',
        fontSize: 14,
    },
    time: {
        color: '#81C784',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bodyContainer: {
        backgroundColor: '#4CAF50',
        flex: 1,
    },
    bodyContent: {
        padding: 20,
        paddingBottom: 10,
    },
    subject: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    bodyText: {
        color: 'white',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 15,
    },
    type: {
        color: 'white',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 10,
    },
    footer: {
        backgroundColor: '#4CAF50',
        padding: 15,
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    checkmarkContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#2E7D32',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    replyButton: {
        backgroundColor: '#2E7D32',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    replyButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    attachmentCountCapsule: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    attachmentCountText: {
        color: '#2E7D32',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default Card; 