import { useState, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

interface UseResponsiveLayoutReturn {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    drawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    toggleDrawer: () => void;
    drawerVariant: 'temporary' | 'persistent' | 'permanent';
    shouldShowMobileMenuButton: boolean;
    drawerWidth: number;
    collapsedDrawerWidth: number;
    isDrawerCollapsed: boolean;
    setIsDrawerCollapsed: (collapsed: boolean) => void;
}

// تنظیمات ثابت drawer
const DRAWER_WIDTHS = {
    desktop: 280,
    tablet: 300,
    mobile: 320,
    collapsedDesktop: 80,
    collapsedOther: 70,
};

export const useResponsiveLayout = (): UseResponsiveLayoutReturn => {
    const theme = useTheme();

    // تشخیص اندازه صفحه با breakpoint‌های بهینه‌شده
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 900px - 1200px
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200px

    const drawerWidth = isDesktop ? DRAWER_WIDTHS.desktop :
        isMobile ? DRAWER_WIDTHS.mobile :
            DRAWER_WIDTHS.tablet;

    const collapsedDrawerWidth = isDesktop ? DRAWER_WIDTHS.collapsedDesktop :
        DRAWER_WIDTHS.collapsedOther;

    // حالت‌های drawer با پشتیبانی از ذخیره‌سازی محلی
    const [drawerOpen, setDrawerOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('drawerOpen');
            return saved ? JSON.parse(saved) : !isMobile;
        }
        return !isMobile;
    });

    const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('drawerCollapsed');
            return saved ? JSON.parse(saved) : false;
        }
        return false;
    });

    // تعیین نوع drawer بر اساس اندازه صفحه
    const getDrawerVariant = (): 'temporary' | 'persistent' | 'permanent' => {
        if (isMobile) return 'temporary'; // drawer روی محتوا باز میشه
        if (isTablet) return 'persistent'; // drawer content رو جابجا میکنه
        return 'permanent'; // drawer همیشه نمایش داده میشه
    };

    const drawerVariant = getDrawerVariant();

    // نمایش دکمه منوی موبایل
    const shouldShowMobileMenuButton = isMobile || isTablet;

    // ذخیره تنظیمات drawer در localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('drawerOpen', JSON.stringify(drawerOpen));
            localStorage.setItem('drawerCollapsed', JSON.stringify(isDrawerCollapsed));
        }
    }, [drawerOpen, isDrawerCollapsed]);

    // تابع toggle بهینه‌شده
    const toggleDrawer = () => {
        if (isMobile) {
            setDrawerOpen(!drawerOpen);
        } else {
            setIsDrawerCollapsed(!isDrawerCollapsed);
        }
    };

    // مدیریت تغییرات اندازه صفحه
    useEffect(() => {
        // روی دسکتاپ drawer همیشه باز باشه
        if (isDesktop) {
            setDrawerOpen(true);
        }
        // روی موبایل drawer پیش‌فرض بسته باشه
        else if (isMobile) {
            setDrawerOpen(false);
        }
        // روی تبلت بر اساس تنظیمات قبلی
        else if (isTablet) {
            // حفظ حالت قبلی
        }
    }, [isMobile, isTablet, isDesktop]);

    // بستن drawer وقتی روی موبایل کلیک میشه
    useEffect(() => {
        if (isMobile && drawerOpen) {
            const handleResize = () => {
                setDrawerOpen(false);
            };

            window.addEventListener('orientationchange', handleResize);
            return () => window.removeEventListener('orientationchange', handleResize);
        }
    }, [isMobile, drawerOpen]);

    return {
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
    };
};