'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    IconButton,
    Tooltip,
    useTheme,
    Avatar,
    Badge,
    Collapse,
    useMediaQuery,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    ExpandLess,
    ExpandMore,
    Dashboard as DashboardIcon,
    People as UsersIcon,
    ContactPhone as ContactIcon,
    Assignment as TicketIcon,
    Chat as MessageCircleIcon,
    TrendingUp,
    BarChart as BarChart3Icon,
    Settings as SettingsIcon,
    ChevronLeft,
    ChevronRight,
    Business as Building2Icon,
    LocalActivity as ActivityIcon,
    CalendarToday as CalendarIcon,
    Work as BriefcaseIcon,
    MyLocation as TargetIcon,
    Description as FileTextIcon,
    Psychology as BrainIcon,
    Inventory as PackageIcon,
    Person as UserIcon,
    Email as MailIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

// کامپوننت استایل شده برای Drawer
const StyledDrawer = styled(Drawer)(({ theme }) => ({
    '& .MuiDrawer-paper': {
        backgroundColor: alpha(theme.palette.background.paper, 0.98),
        backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 50%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
        overflowX: 'hidden',
        borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        backdropFilter: 'blur(20px)',
        transition: theme.transitions.create(['width', 'margin', 'transform'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
        }),
        '&::-webkit-scrollbar': {
            width: '6px',
        },
        '&::-webkit-scrollbar-track': {
            background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.6)} 0%, ${alpha(theme.palette.info.main, 0.6)} 100%)`,
            borderRadius: '8px',
            '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
            },
        },
    },
}));

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<any>;
    badge?: string;
    children?: NavItem[];
}

interface Module {
    id: string;
    name: string;
    display_name: string;
    route: string;
    icon: string;
    sort_order: number;
    parent_id?: string;
}

// نقشه آیکون‌ها
const iconMap: { [key: string]: React.ComponentType<any> } = {
    'Home': DashboardIcon,
    'LayoutDashboard': DashboardIcon,
    'Users': UsersIcon,
    'Users2': TargetIcon,
    'UserCheck': ContactIcon,
    'Activity': ActivityIcon,
    'MessageCircle': MessageCircleIcon,
    'MessageCircle2': MessageCircleIcon,
    'DollarSign': TrendingUp,
    'BarChart3': BarChart3Icon,
    'Calendar': CalendarIcon,
    'User': ContactIcon,
    'Settings': SettingsIcon,
    'Target': TargetIcon,
    'Briefcase': BriefcaseIcon,
    'Ticket': TicketIcon,
    'ChevronRight': ChevronRight,
    'Building2': Building2Icon,
    'TrendingUp': TrendingUp,
    'FileText': FileTextIcon,
    'Brain': BrainIcon,
    'Package': PackageIcon,
    'Mail': MailIcon,
};

// نقشه نام‌های نمایشی روت‌ها
const routeDisplayNames: { [key: string]: string } = {
    '/dashboard': 'داشبورد',
    '/dashboard/customers': 'مشتریان',
    '/dashboard/contacts': 'مخاطبین',
    '/dashboard/coworkers': 'همکاران',
    '/dashboard/activities': 'فعالیت‌ها',
    '/dashboard/chat': 'چت',
    '/dashboard/customer-club': 'باشگاه مشتریان',
    '/dashboard/deals': 'معاملات',
    '/dashboard/feedback': 'بازخوردها',
    '/dashboard/reports': 'گزارش‌ها',
    '/dashboard/daily-reports': 'گزارش‌های روزانه',
    '/dashboard/insights/reports-analysis': 'تحلیل گزارشات',
    '/dashboard/calendar': 'تقویم',
    '/dashboard/profile': 'پروفایل',
    '/dashboard/settings': 'تنظیمات',
    '/dashboard/products': 'محصولات',
};

interface ResponsiveSidebarProps {
    drawerOpen: boolean;
    onDrawerClose: () => void;
    drawerVariant: 'temporary' | 'persistent' | 'permanent';
    drawerWidth: number;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
    drawerOpen,
    onDrawerClose,
    drawerVariant,
    drawerWidth,
    isCollapsed,
    onToggleCollapse,
}) => {
    const pathname = usePathname();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // دریافت مجوزهای کاربر
    useEffect(() => {
        fetchUserPermissions();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();
            if (data.success) {
                setCurrentUser(data.data);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const fetchUserPermissions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/auth/permissions');
            const data = await response.json();

            if (data.success) {
                const modules: Module[] = data.data;
                const convertedNavItems = convertModulesToNavItems(modules);
                setNavItems(convertedNavItems);
            } else {
                console.error('Failed to fetch permissions:', data.message);
                setNavItems(getDefaultNavItems());
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            setNavItems(getDefaultNavItems());
        } finally {
            setLoading(false);
        }
    };

    const getDefaultNavItems = (): NavItem[] => [
        {
            title: 'داشبورد',
            href: '/dashboard',
            icon: DashboardIcon,
        },
        {
            title: 'پروفایل',
            href: '/dashboard/profile',
            icon: UserIcon,
        }
    ];

    const convertModulesToNavItems = (modules: Module[]): NavItem[] => {
        const filteredModules = modules
            .filter(module => module.route && module.route !== '#')
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        const navItems: NavItem[] = [];

        // اضافه کردن داشبورد
        const dashboardModule = filteredModules.find(m => m.name === 'dashboard');
        if (dashboardModule) {
            navItems.push({
                title: routeDisplayNames[dashboardModule.route] || dashboardModule.display_name,
                href: dashboardModule.route,
                icon: iconMap[dashboardModule.icon] || DashboardIcon,
            });
        }

        // چت
        navItems.push({
            title: 'چت',
            href: '/dashboard/chat',
            icon: MessageCircleIcon,
        });

        // باشگاه مشتریان
        navItems.push({
            title: 'باشگاه مشتریان',
            href: '/dashboard/customer-club',
            icon: UsersIcon,
        });

        return navItems;
    };

    // تغییر حالت باز/بسته آیتم‌های فرعی
    const toggleExpanded = (title: string) => {
        setExpandedItems(prev => {
            if (prev.includes(title)) {
                return prev.filter(item => item !== title);
            }
            return [title];
        });
    };

    // رندر آیتم‌های ناوبری
    const renderNavItem = (item: NavItem, level = 0) => {
        const isActive = pathname === item.href;
        const isExpanded = expandedItems.includes(item.title);
        const hasChildren = item.children && item.children.length > 0;
        const IconComponent = item.icon;

        if (hasChildren) {
            return (
                <React.Fragment key={item.title}>
                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <Tooltip title={isCollapsed ? item.title : ''} placement="left">
                            <ListItemButton
                                selected={isActive}
                                onClick={() => {
                                    if (isCollapsed && !isMobile) {
                                        onToggleCollapse();
                                    } else {
                                        toggleExpanded(item.title);
                                    }
                                }}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: isCollapsed ? 'center' : 'initial',
                                    px: 2.5,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: isCollapsed ? 0 : 3,
                                        justifyContent: 'center',
                                        color: isActive ? 'primary.main' : 'inherit',
                                    }}
                                >
                                    <IconComponent />
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.title}
                                    sx={{
                                        opacity: isCollapsed ? 0 : 1,
                                        '& .MuiListItemText-primary': {
                                            fontSize: '0.875rem',
                                            fontWeight: isActive ? 600 : 400,
                                            color: isActive ? 'primary.main' : 'inherit',
                                        },
                                    }}
                                />
                                {!isCollapsed && (
                                    <Box sx={{ ml: 1 }}>
                                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                    </Box>
                                )}
                            </ListItemButton>
                        </Tooltip>
                    </ListItem>
                    <Collapse in={isExpanded && !isCollapsed} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.children?.map((child) => renderNavItem(child, level + 1))}
                        </List>
                    </Collapse>
                </React.Fragment>
            );
        }

        return (
            <ListItem key={item.title} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={isCollapsed ? item.title : ''} placement="left">
                    <ListItemButton
                        selected={isActive}
                        onClick={() => {
                            if (item.href) {
                                router.push(item.href);
                                if (isMobile) {
                                    onDrawerClose();
                                }
                            }
                        }}
                        sx={{
                            minHeight: 48,
                            justifyContent: isCollapsed ? 'center' : 'initial',
                            px: level > 0 ? 4 : 2.5,
                            pl: level > 0 ? 4 : 2.5,
                            backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                            borderRight: isActive ? `3px solid ${theme.palette.primary.main}` : 'none',
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: isCollapsed ? 0 : 3,
                                justifyContent: 'center',
                                color: isActive ? 'primary.main' : 'text.secondary',
                                transition: 'color 0.2s ease',
                            }}
                        >
                            <IconComponent sx={{ fontSize: level > 0 ? '1.1rem' : '1.25rem' }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={item.title}
                            sx={{
                                opacity: isCollapsed ? 0 : 1,
                                '& .MuiListItemText-primary': {
                                    fontSize: level > 0 ? '0.8rem' : '0.875rem',
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? 'primary.main' : 'text.primary',
                                    transition: 'all 0.2s ease',
                                },
                            }}
                        />
                        {item.badge && !isCollapsed && (
                            <Badge
                                badgeContent={item.badge}
                                color="error"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        fontSize: '0.6rem',
                                        height: '16px',
                                        minWidth: '16px',
                                    },
                                }}
                            />
                        )}
                    </ListItemButton>
                </Tooltip>
            </ListItem>
        );
    };

    // محتوای Drawer
    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    borderBottom: '1px solid',
                    borderBottomColor: 'divider',
                    minHeight: 64,
                }}
            >
                {!isCollapsed && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'primary.main',
                                fontSize: '0.875rem',
                            }}
                        >
                            {currentUser?.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {currentUser?.name || 'کاربر'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                                {currentUser?.email || 'user@example.com'}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {!isMobile && (
                    <IconButton
                        onClick={onToggleCollapse}
                        size="small"
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                    >
                        {isCollapsed ? <ChevronLeft /> : <ChevronRight />}
                    </IconButton>
                )}

                {isMobile && (
                    <IconButton
                        onClick={onDrawerClose}
                        size="small"
                        sx={{
                            color: 'text.secondary',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            {/* Navigation */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {loading ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            در حال بارگذاری...
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ pt: 1 }}>
                        {navItems.map((item) => renderNavItem(item))}
                    </List>
                )}
            </Box>

            {/* Footer */}
            {!isCollapsed && (
                <Box
                    sx={{
                        p: 2,
                        borderTop: '1px solid',
                        borderTopColor: 'divider',
                        textAlign: 'center',
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        align="center"
                        display="block"
                        sx={{
                            fontSize: '0.65rem',
                            mt: 0.5,
                            opacity: 0.7
                        }}
                    >
                        رابین تجارت خاورمیانه
                    </Typography>
                </Box>
            )}
        </Box>
    );

    return (
        <StyledDrawer
            variant={drawerVariant}
            open={drawerOpen}
            onClose={onDrawerClose}
            ModalProps={{
                keepMounted: true,
            }}
            sx={{
                width: isCollapsed && !isMobile ? 64 : drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: isCollapsed && !isMobile ? 64 : drawerWidth,
                    boxSizing: 'border-box',
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.easeInOut,
                        duration: theme.transitions.duration.standard,
                    }),
                },
            }}
        >
            {drawerContent}
        </StyledDrawer>
    );
};