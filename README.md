# Campus Market

A modern marketplace platform for university students to buy, sell, and rent items within their campus community.

## Features

- 🔐 Secure authentication with Supabase
- 💬 Real-time messaging system
- 📱 Modern mobile-first UI with React Native
- 🏠 Housing listings and management
- 🛍️ Marketplace for buying and selling items
- 🔍 Advanced search and filtering
- 📸 Image upload and management
- 💰 Secure payment integration
- 🔔 Real-time notifications

## Tech Stack

- **Frontend**: React Native, Expo
- **Backend**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **State Management**: React Query
- **Styling**: React Native StyleSheet
- **Icons**: Expo Vector Icons
- **Animations**: Moti

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/campus_market.git
cd campus_market
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
# or
yarn start
```

## Project Structure

```
campus_market/
├── app/                    # Main application code
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── components/        # Reusable components
│   ├── constants/         # Constants and configuration
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and libraries
│   ├── providers/        # Context providers
│   └── services/         # API and service functions
├── assets/               # Static assets
├── supabase/            # Supabase configuration and migrations
└── types/               # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@campusmarket.com or join our Slack channel.

## Acknowledgments

- [Expo](https://expo.dev/)
- [Supabase](https://supabase.io/)
- [React Native](https://reactnative.dev/)
- [React Query](https://tanstack.com/query/latest) 