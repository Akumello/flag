# Data Call Manager

A comprehensive SLA Data Call Management System with advanced file parsing capabilities.

## 📁 Project Structure

```
c3/
├── package.json                 # Project configuration and scripts
├── README.md                    # Project documentation
├── src/                         # Source code
│   ├── modules/                 # JavaScript modules
│   │   ├── config.js           # Application configuration
│   │   ├── api.js              # API and data management
│   │   ├── validation.js       # Data validation utilities
│   │   └── file-parser.js      # CSV/Excel file parsing
│   ├── main.js                 # Main application logic
│   └── styles/                 # CSS files
│       └── main.css            # Main stylesheet
├── public/                     # Public assets
│   ├── index.html             # Main HTML file
│   └── assets/                # Static assets
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   │   └── file-parser.test.js
│   ├── integration/           # Integration tests
│   │   └── real-data.test.js
│   ├── fixtures/              # Test data
│   │   ├── customers.csv
│   │   ├── employees.csv
│   │   └── products.csv
│   └── utils/                 # Test utilities
│       └── test-runner.js
├── docs/                      # Documentation
│   └── examples/              # Example files
│       └── json-example.json
└── scripts/                   # Build and utility scripts
    └── test.js
```

## 🚀 Getting Started

### Running the Application

```bash
# Start the development server
npm start

# Open your browser to http://localhost:3000
```

### Running Tests

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run all tests
npm run test:all
```

## ✨ Features

- **📊 Data Call Management**: Create and manage enrichment and collection data calls
- **📁 File Parsing**: Advanced CSV and Excel file parsing with data type detection
- **🔍 Column Analysis**: Automatic data type detection (email, phone, currency, URL, etc.)
- **✅ Data Validation**: Configurable validation rules and lists
- **🧮 Calculated Fields**: Support for formulas, conditional logic, and lookups
- **📱 Responsive Design**: Mobile-friendly interface with dark mode support
- **🔒 Security**: Content Security Policy and input sanitization

## 🔧 Architecture

### Modular Design

The application follows a modular architecture:

- **config.js**: Centralized configuration management
- **api.js**: Data layer and API interactions
- **validation.js**: Data validation and sanitization
- **file-parser.js**: File parsing and analysis engine
- **main.js**: Application logic and UI interactions

### File Parser Features

- ✅ CSV parsing with quoted fields and special characters
- ✅ Data type detection (9+ types)
- ✅ JSON field name generation
- ✅ Column metadata extraction
- ✅ Error handling and edge cases
- ✅ Performance optimized for large datasets

## 📝 Development

### Code Organization

- **Source Code**: All application code is in `src/`
- **Tests**: Comprehensive test suite in `tests/`
- **Documentation**: Project docs in `docs/`
- **Public Assets**: Static files in `public/`

### Testing Strategy

- **Unit Tests**: Test individual modules and functions
- **Integration Tests**: Test complete workflows with real data
- **Fixtures**: Sample data files for realistic testing

## 🛠 Scripts

- `npm start` - Start development server
- `npm test` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:all` - Run complete test suite
- `npm run dev` - Alias for npm start

## 📄 License

MIT License - See package.json for details