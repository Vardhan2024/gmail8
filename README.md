# Email Swipe - Frontend Interface

A React Native app built with Expo that provides a Tinder-style card swiping interface for email management. This is a **frontend-only** version with mock data for demonstration purposes.

## Features

- **Smooth Card Animations**: Cards animate smoothly when swiped with realistic physics
- **Gesture Handling**: Pan gestures for natural swiping experience
- **Visual Feedback**: Like/Nope indicators appear during swipes
- **Manual Controls**: Action buttons for users who prefer tapping over swiping
- **Responsive Design**: Works on different screen sizes
- **TypeScript Support**: Full TypeScript implementation for better development experience
- **Rich Reply Interface**: Full-featured email composition with rich text editing
- **Label Management**: Color-coded labels for email categorization
- **Mock Data**: Sample emails for demonstration

## Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **React Native Reanimated**: Smooth animations and gesture handling
- **React Native Gesture Handler**: Advanced gesture recognition
- **TypeScript**: Type safety and better development experience
- **React Navigation**: Screen navigation
- **Rich Text Editor**: Email composition with formatting

## Project Structure

```
Email_swipe/
├── App.tsx                 # Main app entry point
├── package.json            # Dependencies and scripts
├── app.json               # Expo configuration
├── babel.config.js        # Babel configuration
├── tsconfig.json          # TypeScript configuration
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Card.tsx      # Individual card component
│   │   ├── ActionButtons.tsx # Manual swipe buttons
│   │   └── BottomNavigation.tsx # Bottom navigation
│   ├── screens/           # Screen components
│   │   ├── SwipeScreen.tsx # Main swiping screen
│   │   └── ReplyScreen.tsx # Email reply screen
│   ├── data/              # Mock data
│   │   └── mockData.ts    # Sample email data
│   └── types/             # TypeScript type definitions
│       └── index.ts       # Common types
└── assets/                # Images and static assets
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Google Cloud Console account (for OAuth setup)

### Google OAuth Setup

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Gmail API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - `http://localhost:3000/` (for local development)
     - `https://your-domain.vercel.app/` (for production)
   - Copy the Client ID and Client Secret

4. **Set Environment Variables**:
   Create a `.env` file in the root directory:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd Email_swipe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on iOS**:
   ```bash
   npm run ios
   ```

### Development

The app uses Expo's development tools. When you run `npm start`, you'll see a QR code and options to run on different platforms:

- **iOS Simulator**: Press `i` or scan QR code with Expo Go app
- **Android Emulator**: Press `a` or scan QR code with Expo Go app
- **Web**: Press `w` to open in browser

## Usage

### Swiping Cards

1. **Gesture Swiping**: Swipe left to skip, right to reply
2. **Button Controls**: Use the heart (reply) and X (skip) buttons at the bottom
3. **Visual Feedback**: Cards show "LIKE" or "NOPE" indicators during swipes

### Features

- **Card Stack**: Shows 3 cards at once with the top card being interactive
- **Smooth Animations**: Cards rotate and scale during swipes
- **Progress Tracking**: Shows current card position (e.g., "3 of 8")
- **Reset Functionality**: Start over when all cards are swiped
- **Rich Reply Interface**: Compose emails with formatting, attachments, and font selection
- **Label Management**: Create and apply color-coded labels to emails

## Mock Data

The app includes sample email data for demonstration:

- Project updates
- Feature requests
- Bug reports
- Design feedback
- Marketing results

## Customization

### Adding New Emails

Edit the mock data in `src/screens/SwipeScreen.tsx`:

```typescript
const mockEmails: CardData[] = [
    {
        id: 'unique-id',
        sender_name: 'Sender Name',
        sender_email: 'sender@email.com',
        date_column: '2024-01-15',
        time_column: '09:30 AM',
        email_title: 'Email Subject',
        email_summary: 'Email content summary...',
        attachment_ct: 0
    }
];
```

### Styling

- Card styles: `src/components/Card.tsx`
- Button styles: `src/components/ActionButtons.tsx`
- Screen layout: `src/screens/SwipeScreen.tsx`
- Reply interface: `src/screens/ReplyScreen.tsx`

### Animation Configuration

Adjust swipe sensitivity and animations in `src/components/Card.tsx`:

```typescript
const SWIPE_THRESHOLD = screenWidth * 0.25; // Adjust swipe sensitivity
```

## Features

This version includes:

- ✅ Complete UI interface
- ✅ Google OAuth integration for Gmail access
- ✅ Real Gmail API integration
- ✅ Swipe animations and gestures
- ✅ Rich reply interface
- ✅ Label management system
- ✅ AWS backend support (optional)
- ✅ Cross-platform (iOS, Android, Web)

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **iOS Simulator not working**: Ensure Xcode is installed and updated
3. **Gesture not working**: Check that `react-native-gesture-handler` is properly configured

### Debugging

- Use `console.log` statements (visible in Expo DevTools)
- Enable React Native Debugger for advanced debugging
- Check Expo logs for detailed error information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
- Check the [Expo documentation](https://docs.expo.dev/)
- Review [React Native documentation](https://reactnative.dev/)
- Open an issue in the repository 