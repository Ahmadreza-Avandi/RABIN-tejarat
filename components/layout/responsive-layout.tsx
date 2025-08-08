'use client';

import React, { useState, useEffect } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, IconButton, Typography, Fade } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import { Menu as MenuIcon, Brightness4, Brightness7 } from '@mui/icons-material';
import { getMuiTheme } from '@/lib/mui-theme';
import { rtlCache } from '@/lib/rtl-theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { ResponsiveSidebar } from './sidebar';
import { Header } from './header';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
    const { theme: nextTheme, setTheme, systemTheme } = useNextTheme();
    const [mounted, setMounted] = useState(false);

    // تشخیص تم فعلی
    const currentTheme = nextTheme === 'system' ? systemTheme : nextTheme;
    const isDarkMode = currentTheme === 'dark';
    const muiTheme = getMuiTheme(isDarkMode);

    const {
        isMobile,
        isTablet,
        isDesktop,
        drawerOpen,
        setDrawerOpen,
        toggleDrawer,
        drawerVariant,
        shouldShowMobileMenuButton,
        drawerWidth,
        collapsedDrawerWidth,
        isDrawerCollapsed,
        setIsDrawerCollapsed,
    } = useResponsiveLayout();

    // استایل‌های کانتینر اصلی
    const mainContainerStyle = {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: muiTheme.palette.background.default,
        position: 'relative' as const,
    };

    // محاسبه عرض محتوای اصلی بر اساس وضعیت drawer
    const mainContentWidth = React.useMemo(() => {
        if (isMobile) return '100%';
        const sidebarWidth = isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth;
        return `calc(100% - ${drawerVariant === 'permanent' ? sidebarWidth : 0}px)`;
    }, [isMobile, isDrawerCollapsed, collapsedDrawerWidth, drawerWidth, drawerVariant]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // تابع تغییر تم
    const toggleTheme = () => {
        setTheme(isDarkMode ? 'light' : 'dark');
    };

    // بستن drawer در صورت کلیک روی overlay در موبایل
    const handleDrawerClose = () => {
        setDrawerOpen(false);
    };

    // toggle حالت collapse در دسکتاپ
    const handleToggleCollapse = () => {
        if (isDesktop) {
            setIsDrawerCollapsed(!isDrawerCollapsed);
        } else {
            toggleDrawer();
        }
    };

    // محاسبه padding برای محتوای اصلی
    const getMainContentStyles = () => ({
        flexGrow: 1,
        padding: muiTheme.spacing(3),
        transition: muiTheme.transitions.create(['margin'], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.leavingScreen,
        }),
        marginRight: !isDesktop && drawerOpen && drawerVariant === 'persistent' ? drawerWidth : 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative' as const,
        width: '100%',
        zIndex: 1,
        backgroundColor: muiTheme.palette.background.default,
    });

    if (!mounted) {
        return null;
    }

    return (
        <CacheProvider value={rtlCache}>
            <ThemeProvider theme={muiTheme}>
                <CssBaseline />
                <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                    {/* Responsive Sidebar */}
                    <ResponsiveSidebar />

                    {/* Main Content Area */}
                    <Box component="main" sx={getMainContentStyles()}>
                        {/* App Bar برای موبایل/تبلت */}
                        {shouldShowMobileMenuButton && (
                            <AppBar
                                position="sticky"
                                elevation={1}
                                sx={{
                                    zIndex: muiTheme.zIndex.drawer - 1,
                                    bgcolor: 'background.paper',
                                    color: 'text.primary',
                                    borderBottom: '1px solid',
                                    borderBottomColor: 'divider',
                                }}
                            >
                                <Toolbar>
                                    <IconButton
                                        color="inherit"
                                        aria-label="open drawer"
                                        onClick={toggleDrawer}
                                        edge="start"
                                        sx={{ mr: 2 }}
                                    >
                                        <MenuIcon />
                                    </IconButton>

                                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                                        سیستم مدیریت CRM
                                    </Typography>

                                    {/* دکمه تغییر تم */}
                                    <IconButton onClick={toggleTheme} color="inherit">
                                        {isDarkMode ? <Brightness7 /> : <Brightness4 />}
                                    </IconButton>
                                </Toolbar>
                            </AppBar>
                        )}

                        {/* Header برای دسکتاپ */}
                        {!shouldShowMobileMenuButton && (
                            <Fade in={true}>
                                <Box>
                                    <Header />
                                </Box>
                            </Fade>
                        )}

                        {/* محتوای اصلی صفحه */}
                        <Box
                            sx={{
                                flexGrow: 1,
                                p: { xs: 2, sm: 3, md: 4 },
                                bgcolor: 'background.default',
                                minHeight: 'calc(100vh - 64px)', // 64px برای ارتفاع AppBar
                                position: 'relative',
                                overflow: 'auto',
                            }}
                        >
                            {/* Container برای محتوا با حداکثر عرض */}
                            <Box
                                sx={{
                                    maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: '100%', xl: '1400px' },
                                    mx: 'auto',
                                    height: '100%',
                                }}
                            >
                                <Fade in={true} timeout={300}>
                                    <Box sx={{ height: '100%' }}>
                                        {children}
                                    </Box>
                                </Fade>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </ThemeProvider>
        </CacheProvider>
    );
};