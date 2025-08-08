import { createTheme, ThemeOptions } from '@mui/material/styles';

// تعریف breakpoints سفارشی برای responsive design
const breakpoints = {
    values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
    },
};

// تم روشن
const lightTheme: ThemeOptions = {
    direction: 'rtl',
    breakpoints,
    palette: {
        mode: 'light',
        primary: {
            main: '#00B9D4', // cyan
            light: '#4DD0E1',
            dark: '#0097A7',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#4CAF50', // green
            light: '#81C784',
            dark: '#388E3C',
            contrastText: '#ffffff',
        },
        success: {
            main: '#4CAF50',
        },
        warning: {
            main: '#FF9800',
        },
        error: {
            main: '#F44336',
        },
        background: {
            default: '#FAFAFA',
            paper: '#FFFFFF',
        },
        text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
        },
    },
    typography: {
        fontFamily: 'Vazirmatn, Arial, sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.3,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
            lineHeight: 1.4,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            lineHeight: 1.5,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.6,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.7,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    direction: 'rtl',
                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#ffffff',
                    borderLeft: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    margin: '4px 8px',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 185, 212, 0.08)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(0, 185, 212, 0.12)',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 185, 212, 0.16)',
                        },
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    fontFamily: 'Vazirmatn, system-ui, sans-serif',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiInputLabel-root': {
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                    },
                    '& .MuiOutlinedInput-input': {
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                    },
                },
            },
        },
    },
};

// تم تاریک
const darkTheme: ThemeOptions = {
    ...lightTheme,
    palette: {
        mode: 'dark',
        primary: {
            main: '#00B9D4',
            light: '#4DD0E1',
            dark: '#0097A7',
            contrastText: '#000000',
        },
        secondary: {
            main: '#4CAF50',
            light: '#81C784',
            dark: '#388E3C',
            contrastText: '#000000',
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E',
        },
        text: {
            primary: 'rgba(255, 255, 255, 0.87)',
            secondary: 'rgba(255, 255, 255, 0.6)',
        },
    },
    components: {
        ...lightTheme.components,
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1E1E1E',
                    borderLeft: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
                    backgroundColor: '#1E1E1E',
                },
            },
        },
    },
};

// ایجاد تم‌ها
export const muiLightTheme = createTheme(lightTheme);
export const muiDarkTheme = createTheme(darkTheme);

// تابع برای انتخاب تم بر اساس حالت
export const getMuiTheme = (isDark: boolean) => isDark ? muiDarkTheme : muiLightTheme;