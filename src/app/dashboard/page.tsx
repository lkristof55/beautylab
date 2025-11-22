"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import "./dashboard-styles.css";
import BookAppointmentModal from "@/components/BookAppointmentModal";
import AdminLoyalty from "../admin/loyalty/page";
import ProfileTab from "@/components/ProfileTab";
import EditAppointmentForm from "@/components/EditAppointmentForm";
import DayAppointmentsModal from "@/components/DayAppointmentsModal";
import SettingsModal from "@/components/SettingsModal";
import { toast } from "@/components/Toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


type Appointment = {
    id: string;
    service: string;
    date: string;
    status?: string;
    userId?: string;
    user?: { name: string; email: string };
    duration?: number;
    isCompleted?: boolean;
    pointsEarned?: number;
    unregisteredName?: string | null;
    unregisteredPhone?: string | null;
};

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

interface Stats {
    totalAppointments: number;
    totalUsers: number;
    topService: string;
}

interface ServiceCount {
    service: string;
    count: number;
}

export default function DashboardPage() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState("appointments");
    const [adminTab, setAdminTab] = useState("calendar");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState("");

    const [showBooking, setShowBooking] = useState(false);
    
    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Loyalty states
    const [loyaltyData, setLoyaltyData] = useState<{
        loyaltyPoints: number;
        loyaltyTier: string;
        totalVisits: number;
        totalSpent: number;
    } | null>(null);
    const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>([]);
    const [loyaltyTransactions, setLoyaltyTransactions] = useState<any[]>([]);
    const [loyaltyLoading, setLoyaltyLoading] = useState(false);

    const router = useRouter();
    const { user } = useAuth();

    // Admin states
    const [adminAppointments, setAdminAppointments] = useState<Appointment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDayModal, setShowDayModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualDate, setManualDate] = useState<Date | null>(null);
    const [manualService, setManualService] = useState("");
    const [manualTime, setManualTime] = useState("");
    const [manualBusy, setManualBusy] = useState(false);
    const [manualMsg, setManualMsg] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [isUnregisteredUser, setIsUnregisteredUser] = useState(false);
    const [unregisteredName, setUnregisteredName] = useState("");
    const [unregisteredPhone, setUnregisteredPhone] = useState("");
    const [userSearchTerm, setUserSearchTerm] = useState("");
    
    // Invite codes state
    const [inviteCodes, setInviteCodes] = useState<any[]>([]);
    const [inviteCodesLoading, setInviteCodesLoading] = useState(false);

    const SERVICES_CONFIG = {
        "Manikura": { duration: 45, price: 35 },
        "Gel nokti": { duration: 90, price: 55 },
        "Pedikura": { duration: 60, price: 45 },
        "Depilacija - noge": { duration: 45, price: 40 },
        "Depilacija - bikini": { duration: 30, price: 30 },
        "Masaža": { duration: 60, price: 60 },
        "Trepavice": { duration: 90, price: 80 },
        "Obrve": { duration: 30, price: 25 }
    };

    const SERVICES = Object.keys(SERVICES_CONFIG);

    useEffect(() => {
        const loadDashboard = async () => {
            const token = localStorage.getItem("token");
            const userData = localStorage.getItem("user");

            if (!token || !userData) {
                router.push("/login");
                return;
            }

            const parsedUser = JSON.parse(userData);

            // Check if admin
            const adminEmail = 'irena@beautylab.hr';
            const isUserAdmin = parsedUser.email === adminEmail || parsedUser.isAdmin;
            setIsAdmin(isUserAdmin);

            try {
                if (isUserAdmin) {
                    // Admin logic
                    await Promise.all([
                        fetchAdminData(),
                        fetchNotifications()
                    ]);
                } else {
                    // User logic
                    await Promise.all([
                        fetchAppointments(),
                        fetchLoyaltyData(),
                        fetchLoyaltyRewards(),
                        fetchUserInviteCode()
                    ]);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [router]);


    // Osvježi notifikacije svakih 30 sekundi (samo za admina)
    useEffect(() => {
        if (!isAdmin || loading) return;

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [isAdmin, loading]);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const res = await fetch('/api/admin/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    // Zatvori dropdown kada se klikne izvan
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showNotifications && !target.closest('[data-notifications-container]')) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showNotifications]);

    const handleNotificationClick = (notif: any) => {
        setShowNotifications(false);
        
        if (notif.type === 'incomplete') {
            // Pronađi nedovršene termine (stariji od danas, nisu completed)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const incompleteAppointments = adminAppointments.filter(apt => {
                const aptDate = new Date(apt.date);
                aptDate.setHours(0, 0, 0, 0);
                return aptDate < today && !apt.isCompleted;
            });
            
            if (incompleteAppointments.length > 0) {
                // Sortiraj po datumu (najstariji prvi) i uzmi prvi
                incompleteAppointments.sort((a, b) => 
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                
                const firstIncomplete = incompleteAppointments[0];
                setSelectedDate(new Date(firstIncomplete.date));
                setShowDayModal(true);
                setAdminTab('calendar');
            } else {
                // Ako nema nedovršenih, samo prebaci na calendar
                setAdminTab('calendar');
            }
        } else if (notif.type === 'today_appointment') {
            // Za današnje termine, otvori modal za danas
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            setSelectedDate(today);
            setShowDayModal(true);
            setAdminTab('calendar');
        } else if (notif.type === 'new_appointment') {
            // Za nove termine, samo prebaci na calendar
            setAdminTab('calendar');
        } else if (notif.type === 'new_user') {
            setAdminTab('users');
        }
    };

    // Loyalty functions
    const fetchLoyaltyData = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/loyalty/points", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setLoyaltyData(data);
            }
        } catch (error) {
            console.error("Error fetching loyalty data:", error);
        }
    };

    const fetchLoyaltyRewards = async () => {
        try {
            const res = await fetch("/api/loyalty/rewards");
            if (res.ok) {
                const data = await res.json();
                setLoyaltyRewards(data.rewards || []);
            }
        } catch (error) {
            console.error("Error fetching rewards:", error);
        }
    };

    const fetchLoyaltyTransactions = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/loyalty/transactions", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setLoyaltyTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    const redeemReward = async (rewardId: string) => {
        if (loyaltyLoading) return;
        
        setLoyaltyLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/loyalty/rewards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ rewardId }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`Kupon aktiviran! ${data.reward.discount}% popusta.`);
                fetchLoyaltyData();
                fetchLoyaltyTransactions();
            } else {
                toast.error(data.error || "Greška pri aktivaciji kupona");
            }
        } catch (error) {
            toast.error("Greška pri aktivaciji kupona");
        } finally {
            setLoyaltyLoading(false);
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case "Platinum": return "#E5E4E2";
            case "Gold": return "#FFD700";
            case "Silver": return "#C0C0C0";
            default: return "#CD7F32";
        }
    };

    const getTierName = (tier: string) => {
        const names: { [key: string]: string } = {
            "Bronze": "Brončana",
            "Silver": "Srebrna",
            "Gold": "Zlatna",
            "Platinum": "Platinska",
        };
        return names[tier] || tier;
    };

    // Admin functions
    const fetchAdminData = async () => {
        await Promise.all([
            fetchAdminAppointments(),
            fetchUsers(),
            fetchStats()
        ]);
    };

    const fetchAdminAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/appointments', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAdminAppointments(data);
            }
        } catch (err) {
            console.error('Error fetching admin appointments:', err);
        }
    };

    const generateTimeSlots = () => {
        const slots: string[] = [];
        for (let hour = 9; hour < 19; hour++) {
            for (let min = 0; min < 60; min += 30) {
                slots.push(
                    `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
                );
            }
        }
        return slots;
    };

    const isTimeSlotAvailable = (date: Date, time: string, duration: number) => {
        const [h, m] = time.split(":").map(Number);
        const slotStart = new Date(date);
        slotStart.setHours(h, m, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        return !adminAppointments.some((apt) => {
            const aptStart = new Date(apt.date);
            const aptEnd = new Date(
                aptStart.getTime() + (apt.duration || 60) * 60000
            );
            return slotStart < aptEnd && slotEnd > aptStart;
        });
    };

    const saveManualAppointment = async () => {
        if (!manualDate || !manualTime || !manualService) {
            setManualMsg("Molimo ispunite sve podatke.");
            return;
        }

        if (!isUnregisteredUser && !selectedUserId) {
            setManualMsg("Molimo odaberite korisnika.");
            return;
        }

        if (isUnregisteredUser && (!unregisteredName || !unregisteredPhone)) {
            setManualMsg("Molimo unesite ime i kontakt broj za neregistriranog korisnika.");
            return;
        }

        setManualBusy(true);
        setManualMsg(null);

        const [h, m] = manualTime.split(":").map(Number);
        const start = new Date(manualDate);
        start.setHours(h, m, 0, 0);

        const duration = SERVICES_CONFIG[manualService as keyof typeof SERVICES_CONFIG]?.duration || 60;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/admin/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    service: manualService,
                    date: start.toISOString(),
                    duration,
                    ...(isUnregisteredUser 
                        ? { 
                            unregisteredUser: {
                                name: unregisteredName,
                                phone: unregisteredPhone,
                            }
                        } 
                        : { 
                            userId: selectedUserId 
                        }
                    ),
                }),
            });

            if (res.ok) {
                toast.success("Termin uspješno kreiran");
                setShowManualModal(false);
                setManualDate(null);
                setManualTime("");
                setManualService("");
                setSelectedUserId("");
                setIsUnregisteredUser(false);
                setUnregisteredName("");
                setUnregisteredPhone("");
                setUserSearchTerm("");
                setManualMsg(null);
                fetchAdminAppointments();
            } else {
                const errorData = await res.json();
                const errorMessage = errorData.error || "Greška pri kreiranju termina";
                console.error("Error creating appointment:", errorData);
                setManualMsg(errorMessage);
            }
        } catch (error: any) {
            console.error("Error creating appointment:", error);
            setManualMsg(error.message || "Greška pri kreiranju termina");
        } finally {
            setManualBusy(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchInviteCodes = async () => {
        try {
            setInviteCodesLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/invite-codes', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setInviteCodes(data.inviteCodes || []);
            }
        } catch (err) {
            console.error('Error fetching invite codes:', err);
        } finally {
            setInviteCodesLoading(false);
        }
    };

    const generateInviteCode = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/invite-codes', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (res.ok) {
                await fetchInviteCodes();
            } else {
                const error = await res.json();
                alert(error.error || 'Greška pri generiranju invite koda');
            }
        } catch (err) {
            console.error('Error generating invite code:', err);
            alert('Greška pri generiranju invite koda');
        }
    };

    const deleteInviteCode = async (id: string) => {
        if (!confirm('Jeste li sigurni da želite obrisati ovaj invite code?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/invite-codes?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                await fetchInviteCodes();
            } else {
                const error = await res.json();
                alert(error.error || 'Greška pri brisanju invite koda');
            }
        } catch (err) {
            console.error('Error deleting invite code:', err);
            alert('Greška pri brisanju invite koda');
        }
    };

    const copyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert('Invite code kopiran!');
    };

    // User functions
    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/appointments", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAppointments(data.appointments || []);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    const fetchUserInviteCode = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            // Dohvati invite kodove koje je user kreirao
            const res = await fetch("/api/invite-codes/user", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                const userCodes = data.inviteCodes || [];
                
                if (userCodes.length > 0) {
                    // Pronađi dostupan kod ili zadnji kreirani
                    const availableCode = userCodes.find((code: any) => !code.usedBy);
                    const lastCode = userCodes[0]; // Već su sortirani po datumu desc
                    setInviteCode(availableCode?.code || lastCode.code);
                } else {
                    setInviteCode("");
                }
            } else {
                setInviteCode("");
            }
        } catch (error) {
            console.error("Error fetching user invite code:", error);
            setInviteCode("");
        }
    };

    const generateUserInviteCode = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/invite-codes/generate", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                const data = await res.json();
                setInviteCode(data.inviteCode.code);
                // Osvježi invite kodove
                await fetchUserInviteCode();
            } else {
                const errorData = await res.json();
                alert(errorData.error || "Greška pri generiranju invite koda");
            }
        } catch (error) {
            console.error("Error generating invite code:", error);
            alert("Greška pri generiranju invite koda");
        }
    };

    const cancelAppointment = async (id: string) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/api/appointments`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ appointmentId: id }),
            });

            if (res.ok) {
                setAppointments(prev => prev.filter(a => a.id !== id));
                toast.success("Termin uspješno otkazan!");
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Greška pri otkazivanju termina");
            }
        } catch (error) {
            console.error("Error canceling appointment:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.toLocaleString("hr-HR", { month: "short" }).toUpperCase(),
            time: date.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }),
            full: date.toLocaleDateString("hr-HR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
        };
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Kopirano u međuspremnik!");
    };

    // Admin specific functions
    const getServiceBreakdown = (): ServiceCount[] => {
        const serviceMap = new Map<string, number>();
        adminAppointments.forEach(apt => {
            const count = serviceMap.get(apt.service) || 0;
            serviceMap.set(apt.service, count + 1);
        });
        return Array.from(serviceMap, ([service, count]) => ({ service, count }))
            .sort((a, b) => b.count - a.count);
    };

    const getTodayCount = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return adminAppointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= today && aptDate < tomorrow;
        }).length;
    };

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Convert appointments to FullCalendar events
    const calendarEvents = adminAppointments.map(apt => {
        const start = new Date(apt.date);
        const end = new Date(start.getTime() + (apt.duration || 60) * 60000);
        const isCompleted = apt.isCompleted;
        const userName = apt.user?.name || apt.unregisteredName || "Neregistrirani";

        return {
            id: apt.id,
            title: `${apt.service} – ${userName}${isCompleted ? " ✅" : ""}`,
            start,
            end,
            backgroundColor: isCompleted ? "#10b981" : "#e07e9e",
            borderColor: isCompleted ? "#059669" : "#d49ca3",
            textColor: "#fff"
        };
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Učitavanje...</p>
                </div>
            </div>
        );
    }

    // ADMIN DASHBOARD
    if (isAdmin) {
        return (
            <div style={{
                display: 'flex',
                minHeight: '100vh',
                background: 'var(--porcelain)',
                position: 'relative'
            }}>
                {/* Fixed Sidebar */}
                <aside style={{
                    width: '260px',
                    background: 'white',
                    borderRight: '1px solid var(--beige)',
                    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '2rem 1.5rem',
                        borderBottom: '1px solid var(--beige)'
                    }}>
                        <h2 className="panel-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                            Admin Panel 💅
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--graphite)', opacity: 0.7 }}>
                            Beauty Lab by Irena
                        </p>
                    </div>

                    <nav style={{ padding: '1rem', flex: 1 }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setAdminTab('calendar')}
                                    className={`tab-button ${adminTab === 'calendar' ? 'active' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.3s',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        background: adminTab === 'calendar' ? 'var(--rose)' : 'transparent',
                                        color: adminTab === 'calendar' ? 'white' : 'var(--graphite)',
                                        border: 'none',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>📅</span>
                                    <span style={{ fontWeight: '500' }}>Termini</span>
                                </button>
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setAdminTab('users')}
                                    className={`tab-button ${adminTab === 'users' ? 'active' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.3s',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        background: adminTab === 'users' ? 'var(--rose)' : 'transparent',
                                        color: adminTab === 'users' ? 'white' : 'var(--graphite)',
                                        border: 'none',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>👩‍💻</span>
                                    <span style={{ fontWeight: '500' }}>Korisnice</span>
                                </button>
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setAdminTab('stats')}
                                    className={`tab-button ${adminTab === 'stats' ? 'active' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.3s',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        background: adminTab === 'stats' ? 'var(--rose)' : 'transparent',
                                        color: adminTab === 'stats' ? 'white' : 'var(--graphite)',
                                        border: 'none',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>📊</span>
                                    <span style={{ fontWeight: '500' }}>Statistika</span>
                                </button>
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setAdminTab('loyalty')}
                                    className={`tab-button ${adminTab === 'loyalty' ? 'active' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.3s',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        background: adminTab === 'loyalty' ? 'var(--rose)' : 'transparent',
                                        color: adminTab === 'loyalty' ? 'white' : 'var(--graphite)',
                                        border: 'none',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>⭐</span>
                                    <span style={{ fontWeight: '500' }}>Loyalty</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => {
                                        setAdminTab('invite-codes');
                                        fetchInviteCodes();
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.3s',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        background: adminTab === 'invite-codes' ? 'var(--rose)' : 'transparent',
                                        color: adminTab === 'invite-codes' ? 'white' : 'var(--graphite)',
                                        border: 'none',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>🎫</span>
                                    <span style={{ fontWeight: '500' }}>Invite Kodovi</span>
                                </button>
                            </li>
                        </ul>

                        <div style={{
                            borderTop: '1px solid var(--beige)',
                            marginTop: '2rem',
                            paddingTop: '2rem'
                        }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="btn-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.875rem 1rem',
                                            borderRadius: '0.75rem',
                                            transition: 'all 0.3s',
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            color: 'var(--graphite)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.25rem' }}>🚪</span>
                                        <span style={{ fontWeight: '500' }}>Odjava</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    {user && (
                        <div style={{
                            padding: '1.5rem',
                            borderTop: '1px solid var(--beige)',
                            background: 'var(--porcelain)',
                            marginTop: 'auto'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    background: 'var(--rose)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.125rem'
                                }}>
                                    {user.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <p style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: 'var(--graphite)',
                                        margin: 0
                                    }}>
                                        {user.name || 'Admin'}
                                    </p>
                                    <p style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--graphite)',
                                        opacity: 0.7,
                                        margin: 0
                                    }}>
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main style={{
                    marginLeft: '260px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh'
                }}>
                    <div style={{
                        background: 'white',
                        borderBottom: '1px solid var(--beige)',
                        padding: '1.5rem 2rem',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h1 style={{
                                    fontSize: '1.5rem',
                                    marginBottom: '0.25rem',
                                    fontWeight: '600',
                                    color: 'var(--graphite)'
                                }}>
                                    {adminTab === 'calendar' && '📅 Kalendar termina'}
                                    {adminTab === 'users' && '👩‍💻 Upravljanje korisnicima'}
                                    {adminTab === 'stats' && '📊 Statistika i analitika'}
                                    {adminTab === 'loyalty' && '⭐ Loyalty program'}
                                    {adminTab === 'invite-codes' && '🎫 Upravljanje Invite Kodovima'}
                                </h1>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.875rem',
                                    color: 'var(--graphite)',
                                    opacity: 0.7
                                }}>
                                    {new Date().toLocaleDateString('hr-HR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ position: 'relative' }} data-notifications-container>
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="btn btn-outline btn-sm"
                                        style={{ position: 'relative' }}
                                    >
                                        <span style={{ fontSize: '1.25rem' }}>🔔</span>
                                        {unreadCount > 0 && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '-0.25rem',
                                                right: '-0.25rem',
                                                background: 'var(--rose)',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold'
                                            }}>
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {showNotifications && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 0.5rem)',
                                            right: 0,
                                            background: 'white',
                                            borderRadius: '0.75rem',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                            width: '360px',
                                            maxHeight: '480px',
                                            overflow: 'auto',
                                            zIndex: 1000,
                                            border: '1px solid var(--beige)'
                                        }}>
                                            <div style={{ 
                                                padding: '1.25rem', 
                                                borderBottom: '1px solid var(--beige)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--graphite)' }}>
                                                    Notifikacije
                                                </h3>
                                                {unreadCount > 0 && (
                                                    <span style={{
                                                        background: 'var(--rose)',
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '1rem',
                                                        fontWeight: 600
                                                    }}>
                                                        {unreadCount} nov{unreadCount === 1 ? 'a' : 'ih'}
                                                    </span>
                                                )}
                                            </div>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--graphite)', opacity: 0.6 }}>
                                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔕</div>
                                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Nema novih notifikacija</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    {notifications.map((notif, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleNotificationClick(notif)}
                                                            style={{
                                                                padding: '1.25rem',
                                                                borderBottom: idx < notifications.length - 1 ? '1px solid var(--beige)' : 'none',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.2s',
                                                                background: 'white'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--porcelain)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                                                                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                                                                    {notif.icon}
                                                                </span>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <p style={{ 
                                                                        margin: 0, 
                                                                        fontSize: '0.9rem', 
                                                                        fontWeight: 500,
                                                                        color: 'var(--graphite)',
                                                                        lineHeight: '1.4'
                                                                    }}>
                                                                        {notif.message}
                                                                    </p>
                                                                    <p style={{ 
                                                                        margin: '0.25rem 0 0 0', 
                                                                        fontSize: '0.75rem', 
                                                                        color: 'var(--graphite)',
                                                                        opacity: 0.6
                                                                    }}>
                                                                        {notif.type === 'new_appointment' && 'Klikni za pregled termina'}
                                                                        {notif.type === 'today_appointment' && 'Klikni za pregled današnjih termina'}
                                                                        {notif.type === 'new_user' && 'Klikni za pregled korisnika'}
                                                                        {notif.type === 'incomplete' && 'Klikni za dovršavanje termina'}
                                                                    </p>
                                                                </div>
                                                                <span style={{
                                                                    background: notif.priority === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                                                                              notif.priority === 'warning' ? 'rgba(251, 191, 36, 0.1)' : 
                                                                              'rgba(59, 130, 246, 0.1)',
                                                                    color: notif.priority === 'error' ? '#ef4444' : 
                                                                           notif.priority === 'warning' ? '#fbbf24' : 
                                                                           '#3b82f6',
                                                                    fontSize: '0.75rem',
                                                                    padding: '0.25rem 0.5rem',
                                                                    borderRadius: '0.5rem',
                                                                    fontWeight: 600,
                                                                    flexShrink: 0
                                                                }}>
                                                                    {notif.count}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Settings Button */}
                                <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowSettings(true);
                                    }}
                                    style={{ 
                                        position: 'relative', 
                                        zIndex: 10,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '40px',
                                        height: '40px'
                                    }}
                                    title="Postavke"
                                >
                                    <span style={{ fontSize: '1.25rem' }}>⚙️</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        padding: '1rem'
                    }}>
                        {/* Calendar Tab with FullCalendar */}
                        {adminTab === 'calendar' && (
                            <div style={{
                                padding: '2rem',
                                background: 'white',
                                borderRadius: '1rem',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <h2 style={{
                                    marginBottom: '2rem',
                                    fontSize: '1.5rem',
                                    color: 'var(--graphite)'
                                }}>
                                    Svi termini
                                </h2>
                                <div style={{ flex: 1 }}>
                                    <FullCalendar
                                        plugins={[dayGridPlugin, interactionPlugin]}
                                        initialView="dayGridMonth"
                                        headerToolbar={{
                                            left: 'prev,next today',
                                            center: 'title',
                                            right: 'dayGridMonth,dayGridWeek,dayGridDay'
                                        }}
                                        events={calendarEvents}
                                        dateClick={(info) => {
                                            info.jsEvent.preventDefault();
                                            info.jsEvent.stopPropagation();
                                            setSelectedDate(info.date);
                                            setShowDayModal(true);
                                        }}
                                        eventClick={(info) => {
                                            info.jsEvent.preventDefault();
                                            info.jsEvent.stopPropagation();
                                            
                                            // Otvori modal za dan kada se klikne na termin
                                            setSelectedDate(info.event.start || new Date());
                                            setShowDayModal(true);
                                        }}
                                        locale='hr'
                                        height="auto"
                                        dayMaxEvents={3}
                                        eventDisplay='block'
                                        eventColor='#e07e9e'
                                    />
                                </div>

                                {/* Day Appointments Modal */}
                                <DayAppointmentsModal
                                    open={showDayModal}
                                    onClose={() => {
                                        setShowDayModal(false);
                                        setSelectedDate(null);
                                    }}
                                    date={selectedDate}
                                    appointments={adminAppointments}
                                    onCreateNew={(date) => {
                                        setManualDate(date);
                                        setManualService("");
                                        setManualTime("");
                                        setSelectedUserId("");
                                        setIsUnregisteredUser(false);
                                        setUnregisteredName("");
                                        setUnregisteredPhone("");
                                        setUserSearchTerm("");
                                        setManualMsg(null);
                                        setShowManualModal(true);
                                    }}
                                    onComplete={async (appointmentId: string) => {
                                        try {
                                            const token = localStorage.getItem("token");
                                            const res = await fetch("/api/admin/appointments/complete", {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ appointmentId }),
                                            });

                                            if (res.ok) {
                                                const data = await res.json();
                                                toast.success(`Termin označen kao završen! Korisnik je dobio ${data.pointsEarned} bodova.`);
                                                fetchAdminAppointments();
                                            } else {
                                                const errorData = await res.json();
                                                toast.error(errorData.error || "Greška pri označavanju termina");
                                            }
                                        } catch (error) {
                                            toast.error("Greška pri označavanju termina");
                                        }
                                    }}
                                    onUpdate={async (appointmentId: string, date: string, service: string) => {
                                        try {
                                            const token = localStorage.getItem("token");
                                            const res = await fetch("/api/admin/appointments", {
                                                method: "PUT",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ appointmentId, date, service }),
                                            });

                                            if (res.ok) {
                                                toast.success("Termin uspješno ažuriran");
                                                fetchAdminAppointments();
                                            } else {
                                                const errorData = await res.json();
                                                toast.error(errorData.error || "Greška pri ažuriranju termina");
                                            }
                                        } catch (error) {
                                            toast.error("Greška pri ažuriranju termina");
                                        }
                                    }}
                                    onDelete={async (appointmentId: string) => {
                                        try {
                                            const token = localStorage.getItem("token");
                                            const res = await fetch("/api/admin/appointments", {
                                                method: "DELETE",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ appointmentId }),
                                            });

                                            if (res.ok) {
                                                toast.success("Termin uspješno obrisan");
                                                fetchAdminAppointments();
                                            } else {
                                                const errorData = await res.json();
                                                toast.error(errorData.error || "Greška pri brisanju termina");
                                            }
                                        } catch (error) {
                                            toast.error("Greška pri brisanju termina");
                                        }
                                    }}
                                    onRefresh={fetchAdminAppointments}
                                />

                                {/* Manual Appointment Creation Modal */}
                                {showManualModal && (
                                    <div 
                                        className="booking-modal-overlay" 
                                        onClick={(e) => {
                                            // Zatvori modal samo ako se klikne direktno na overlay
                                            if (e.target === e.currentTarget) {
                                                setShowManualModal(false); 
                                                setManualDate(null); 
                                                setManualTime(""); 
                                                setManualService("");
                                                setManualMsg(null);
                                            }
                                        }}
                                    >
                                        <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                                            <div className="booking-modal-header">
                                                <h2 style={{ 
                                                    fontSize: "var(--font-size-xl)", 
                                                    marginBottom: 0,
                                                    color: "var(--color-on-surface)",
                                                    fontFamily: "var(--font-family-heading)",
                                                    fontWeight: 700
                                                }}>
                                                    Dodaj novi termin
                                                </h2>
                                                <button
                                                    onClick={() => {
                                                        setShowManualModal(false);
                                                        setManualDate(null);
                                                        setManualTime("");
                                                        setManualService("");
                                                        setSelectedUserId("");
                                                        setIsUnregisteredUser(false);
                                                        setUnregisteredName("");
                                                        setUnregisteredPhone("");
                                                        setUserSearchTerm("");
                                                        setManualMsg(null);
                                                    }}
                                                    className="booking-modal-close"
                                                    aria-label="Zatvori"
                                                >
                                                    ×
                                                </button>
                                            </div>

                                            <div className="booking-modal-body">
                                                {manualMsg && (
                                                    <div className={`booking-msg ${manualMsg.includes("Greška") ? "error" : "success"}`}>
                                                        {manualMsg}
                                                    </div>
                                                )}

                                                {/* Date Display */}
                                                {manualDate && (
                                                    <div className="booking-field">
                                                        <label className="booking-label">Datum</label>
                                                        <div style={{
                                                            padding: "0.75rem",
                                                            border: "1px solid var(--beige)",
                                                            borderRadius: "8px",
                                                            background: "var(--color-surface)",
                                                            color: "var(--color-on-surface)",
                                                            fontSize: "var(--font-size-base)"
                                                        }}>
                                                            {manualDate.toLocaleDateString("hr-HR", {
                                                                weekday: "long",
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Service */}
                                                <div className="booking-field">
                                                    <label className="booking-label">Usluga</label>
                                                    <select
                                                        className="booking-input"
                                                        value={manualService}
                                                        onChange={(e) => {
                                                            setManualService(e.target.value);
                                                            setManualTime("");
                                                        }}
                                                    >
                                                        <option value="">Odaberi uslugu...</option>
                                                        {SERVICES.map((s) => (
                                                            <option key={s} value={s}>
                                                                {s} ({SERVICES_CONFIG[s as keyof typeof SERVICES_CONFIG].duration} min)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* User Selection */}
                                                {manualService && (
                                                    <div className="booking-field">
                                                        <label className="booking-label">Korisnik</label>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                            {/* Search Input */}
                                                            <input
                                                                type="text"
                                                                className="booking-input"
                                                                placeholder="Pretraži korisnike po imenu ili emailu..."
                                                                value={userSearchTerm}
                                                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                                                style={{ marginBottom: "0.25rem" }}
                                                            />
                                                            
                                                            <select
                                                                className="booking-input"
                                                                value={isUnregisteredUser ? "unregistered" : selectedUserId}
                                                                onChange={(e) => {
                                                                    if (e.target.value === "unregistered") {
                                                                        setIsUnregisteredUser(true);
                                                                        setSelectedUserId("");
                                                                        setUserSearchTerm("");
                                                                    } else {
                                                                        setIsUnregisteredUser(false);
                                                                        setSelectedUserId(e.target.value);
                                                                        setUserSearchTerm("");
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">Odaberi korisnika...</option>
                                                                <option value="unregistered">➕ Neregistrirani korisnik</option>
                                                                {users
                                                                    .filter((user) => {
                                                                        if (!userSearchTerm) return true;
                                                                        const search = userSearchTerm.toLowerCase();
                                                                        return (
                                                                            user.name.toLowerCase().includes(search) ||
                                                                            user.email.toLowerCase().includes(search)
                                                                        );
                                                                    })
                                                                    .map((user) => (
                                                                        <option key={user.id} value={user.id}>
                                                                            {user.name} ({user.email})
                                                                        </option>
                                                                    ))}
                                                            </select>

                                                            {isUnregisteredUser && (
                                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", padding: "1rem", background: "var(--color-surface)", borderRadius: "8px" }}>
                                                                    <div>
                                                                        <label className="booking-label" style={{ fontSize: "var(--font-size-xs)", marginBottom: "0.25rem" }}>
                                                                            Ime i prezime
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            className="booking-input"
                                                                            value={unregisteredName}
                                                                            onChange={(e) => setUnregisteredName(e.target.value)}
                                                                            placeholder="Unesite ime i prezime..."
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="booking-label" style={{ fontSize: "var(--font-size-xs)", marginBottom: "0.25rem" }}>
                                                                            Kontakt broj
                                                                        </label>
                                                                        <input
                                                                            type="tel"
                                                                            className="booking-input"
                                                                            value={unregisteredPhone}
                                                                            onChange={(e) => setUnregisteredPhone(e.target.value)}
                                                                            placeholder="Unesite kontakt broj..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Time */}
                                                {manualDate && manualService && (
                                                    <div className="booking-field">
                                                        <label className="booking-label">Vrijeme</label>
                                                        <div className="booking-times">
                                                            {generateTimeSlots().map((time) => {
                                                                const duration =
                                                                    SERVICES_CONFIG[manualService as keyof typeof SERVICES_CONFIG].duration;
                                                                const available = isTimeSlotAvailable(
                                                                    manualDate,
                                                                    time,
                                                                    duration
                                                                );
                                                                return (
                                                                    <button
                                                                        key={time}
                                                                        type="button"
                                                                        className={`booking-time ${
                                                                            manualTime === time ? "active" : ""
                                                                        } ${!available ? "disabled" : ""}`}
                                                                        disabled={!available}
                                                                        onClick={() => available && setManualTime(time)}
                                                                    >
                                                                        {time}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="booking-modal-footer">
                                                <button
                                                    onClick={() => {
                                                        setShowManualModal(false);
                                                        setManualDate(null);
                                                        setManualTime("");
                                                        setManualService("");
                                                        setSelectedUserId("");
                                                        setIsUnregisteredUser(false);
                                                        setUnregisteredName("");
                                                        setUnregisteredPhone("");
                                                        setUserSearchTerm("");
                                                        setManualMsg(null);
                                                    }}
                                                    className="btn btn-outline"
                                                >
                                                    Odustani
                                                </button>

                                                <button
                                                    onClick={saveManualAppointment}
                                                    disabled={!manualService || !manualDate || !manualTime || manualBusy || (!isUnregisteredUser && !selectedUserId) || (isUnregisteredUser && (!unregisteredName || !unregisteredPhone))}
                                                    className="btn btn-primary"
                                                >
                                                    {manualBusy ? "Spremam..." : "Spremi"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* Users Tab */}
                        {adminTab === 'users' && (
                            <div style={{ padding: '2rem', background: 'white', borderRadius: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', color: 'var(--graphite)' }}>
                                        Korisnici ({users.length})
                                    </h2>
                                    <input
                                        type="text"
                                        placeholder="Pretraži korisnike..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: '1px solid var(--beige)',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                        <tr style={{ borderBottom: '2px solid var(--beige)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>#</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Ime</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Datum registracije</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredUsers.map((user, index) => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid var(--beige)' }}>
                                                <td style={{ padding: '1rem' }}>{index + 1}</td>
                                                <td style={{ padding: '1rem' }}>{user.name}</td>
                                                <td style={{ padding: '1rem' }}>{user.email}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    {new Date(user.createdAt).toLocaleDateString('hr-HR')}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Stats Tab */}
                        {adminTab === 'stats' && (
                            <div style={{ padding: '2rem' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1.5rem',
                                    marginBottom: '2rem'
                                }}>
                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number">{stats?.totalAppointments || 0}</span>
                                            <span className="points-label">Ukupno termina</span>
                                        </div>
                                    </div>
                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number">{stats?.totalUsers || 0}</span>
                                            <span className="points-label">Ukupno korisnica</span>
                                        </div>
                                    </div>
                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number" style={{ fontSize: '1.8rem' }}>
                                                {stats?.topService || 'N/A'}
                                            </span>
                                            <span className="points-label">Najpopularnija usluga</span>
                                        </div>
                                    </div>
                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number">{getTodayCount()}</span>
                                            <span className="points-label">Termini danas</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Service breakdown */}
                                <div style={{
                                    background: 'white',
                                    borderRadius: '1rem',
                                    padding: '1.5rem'
                                }}>
                                    <h3 className="section-label" style={{ marginBottom: '1.5rem' }}>
                                        Usluge po popularnosti
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {getServiceBreakdown().map((item, index) => {
                                            const percentage = stats?.totalAppointments
                                                ? Math.round((item.count / stats.totalAppointments) * 100)
                                                : 0;
                                            return (
                                                <div key={item.service}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        <span style={{ fontWeight: '500' }}>
                                                            {index + 1}. {item.service}
                                                        </span>
                                                        <span style={{ color: 'var(--graphite)', opacity: 0.8 }}>
                                                            {item.count} ({percentage}%)
                                                        </span>
                                                    </div>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loyalty Tab */}
                        {adminTab === 'loyalty' && (
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <AdminLoyalty />
                            </div>
                        )}

                        {/* Invite Codes Tab */}
                        {adminTab === 'invite-codes' && (
                            <div style={{ 
                                flex: 1, 
                                overflow: 'auto', 
                                padding: '2rem',
                                background: 'var(--porcelain)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '2rem'
                                }}>
                                    <div>
                                        <h2 style={{ 
                                            fontSize: '1.5rem', 
                                            fontWeight: 600, 
                                            margin: 0,
                                            color: 'var(--graphite)'
                                        }}>
                                            Upravljanje Invite Kodovima
                                        </h2>
                                        <p style={{ 
                                            margin: '0.5rem 0 0 0',
                                            color: 'var(--graphite)',
                                            opacity: 0.7,
                                            fontSize: '0.875rem'
                                        }}>
                                            Generiraj i upravljaj invite kodovima za registraciju novih korisnika
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Jeste li sigurni da želite obrisati SVE invite kodove? Ova akcija se ne može poništiti.')) {
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const res = await fetch('/api/admin/invite-codes/reset', {
                                                            method: 'DELETE',
                                                            headers: { Authorization: `Bearer ${token}` },
                                                        });
                                                        if (res.ok) {
                                                            await fetchInviteCodes();
                                                            alert('Svi invite kodovi su obrisani');
                                                        } else {
                                                            alert('Greška pri brisanju kodova');
                                                        }
                                                    } catch (error) {
                                                        alert('Greška pri brisanju kodova');
                                                    }
                                                }
                                            }}
                                            className="btn btn-outline"
                                            style={{ 
                                                minWidth: 'auto',
                                                color: '#dc2626',
                                                borderColor: '#dc2626'
                                            }}
                                        >
                                            🗑️ Reset
                                        </button>
                                        <button
                                            onClick={generateInviteCode}
                                            className="btn btn-primary"
                                            style={{ minWidth: '180px' }}
                                        >
                                            + Generiraj novi kod
                                        </button>
                                    </div>
                                </div>

                                {inviteCodesLoading ? (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '3rem',
                                        color: 'var(--graphite)',
                                        opacity: 0.7
                                    }}>
                                        Učitavanje...
                                    </div>
                                ) : inviteCodes.length === 0 ? (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '3rem',
                                        background: 'white',
                                        borderRadius: '1rem',
                                        color: 'var(--graphite)',
                                        opacity: 0.7
                                    }}>
                                        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                                            Nema invite kodova
                                        </p>
                                        <p style={{ fontSize: '0.875rem' }}>
                                            Kliknite na "Generiraj novi kod" da kreirate prvi invite code
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '1rem',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                    }}>
                                        <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse'
                                        }}>
                                            <thead>
                                                <tr style={{
                                                    background: 'var(--rose)',
                                                    color: 'white'
                                                }}>
                                                    <th style={{
                                                        padding: '1rem',
                                                        textAlign: 'left',
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        Kod
                                                    </th>
                                                    <th style={{
                                                        padding: '1rem',
                                                        textAlign: 'left',
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        Kreiran
                                                    </th>
                                                    <th style={{
                                                        padding: '1rem',
                                                        textAlign: 'left',
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        Korišten od
                                                    </th>
                                                    <th style={{
                                                        padding: '1rem',
                                                        textAlign: 'left',
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        Status
                                                    </th>
                                                    <th style={{
                                                        padding: '1rem',
                                                        textAlign: 'right',
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        Akcije
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inviteCodes.map((code: any) => (
                                                    <tr
                                                        key={code.id}
                                                        style={{
                                                            borderBottom: '1px solid var(--beige)',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'var(--porcelain)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'white';
                                                        }}
                                                    >
                                                        <td style={{ padding: '1rem' }}>
                                                            <code style={{
                                                                background: 'var(--porcelain)',
                                                                padding: '0.5rem 0.75rem',
                                                                borderRadius: '6px',
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.875rem',
                                                                fontWeight: 600,
                                                                color: 'var(--graphite)',
                                                                display: 'inline-block'
                                                            }}>
                                                                {code.code}
                                                            </code>
                                                        </td>
                                                        <td style={{ padding: '1rem', color: 'var(--graphite)' }}>
                                                            {new Date(code.createdAt).toLocaleDateString('hr-HR', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            {code.usedByUser ? (
                                                                <div>
                                                                    <div style={{ 
                                                                        fontWeight: 500,
                                                                        color: 'var(--graphite)'
                                                                    }}>
                                                                        {code.usedByUser.name}
                                                                    </div>
                                                                    <div style={{ 
                                                                        fontSize: '0.75rem',
                                                                        color: 'var(--graphite)',
                                                                        opacity: 0.6
                                                                    }}>
                                                                        {code.usedByUser.email}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span style={{ 
                                                                    color: 'var(--graphite)',
                                                                    opacity: 0.5,
                                                                    fontStyle: 'italic'
                                                                }}>
                                                                    Nije korišten
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            {code.usedBy ? (
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    color: '#10b981',
                                                                    fontWeight: 500,
                                                                    fontSize: '0.875rem'
                                                                }}>
                                                                    <span>✓</span> Korišten
                                                                </span>
                                                            ) : (
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    color: '#f59e0b',
                                                                    fontWeight: 500,
                                                                    fontSize: '0.875rem'
                                                                }}>
                                                                    <span>○</span> Dostupan
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    onClick={() => copyInviteCode(code.code)}
                                                                    className="btn btn-outline btn-sm"
                                                                    style={{ minWidth: 'auto' }}
                                                                >
                                                                    Kopiraj
                                                                </button>
                                                                {!code.usedBy && (
                                                                    <button
                                                                        onClick={() => deleteInviteCode(code.id)}
                                                                        className="btn btn-outline btn-sm"
                                                                        style={{
                                                                            minWidth: 'auto',
                                                                            color: '#dc2626',
                                                            borderColor: '#dc2626'
                                                                        }}
                                                                    >
                                                                        Obriši
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
                
                {/* Settings Modal */}
                <SettingsModal 
                    open={showSettings} 
                    onClose={() => setShowSettings(false)} 
                />
            </div>
        );
    }

    // USER DASHBOARD (ostatak koda ostaje isti)
    const upcomingAppointments = appointments
        .filter(a => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const d = new Date(a.date);
            d.setHours(0, 0, 0, 0);

            return d >= now;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    const pastAppointments = appointments
        .filter(a => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const d = new Date(a.date);
            d.setHours(0, 0, 0, 0);

            return d < now;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    return (
        <div className="user-dashboard-container">
            <Navbar className={showBooking ? "navbar-hide" : ""} />

            <main className="user-dashboard-main">
                <div className="dashboard-container">
                    <div className="tab-navigation">
                        <button
                            className={`tab-button ${activeTab === "appointments" ? "active" : ""}`}
                            onClick={() => setActiveTab("appointments")}
                        >
                            Moji Termini
                        </button>
                        <button
                            className={`tab-button ${activeTab === "loyalty" ? "active" : ""}`}
                            onClick={() => setActiveTab("loyalty")}
                        >
                            Loyalty & Kuponi
                        </button>
                        <button
                            className={`tab-button ${activeTab === "invite" ? "active" : ""}`}
                            onClick={() => setActiveTab("invite")}
                        >
                            Pozovi Prijatelje
                        </button>
                        <button
                            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
                            onClick={() => setActiveTab("profile")}
                        >
                            Profil
                        </button>
                    </div>

                    <div className="tab-content-wrapper">
                        {activeTab === "appointments" && (
                            <div className="tab-panel appointments-panel active">
                                <header className="panel-header">
                                    <h2 className="panel-title">Moji Termini</h2>
                                    <p className="panel-subtitle">
                                        Nadolazeće rezervacije i nedavne posjete
                                    </p>
                                    {upcomingAppointments.length > 0 && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => setShowBooking(true)}
                                        >
                                            + Nova rezervacija
                                        </button>
                                    )}
                                </header>

                                <div className="appointments-content">
                                    <div className="appointments-upcoming">
                                        <h3 className="section-label">Nadolazeći termini</h3>
                                        {upcomingAppointments.length > 0 ? (
                                            <>
                                                {upcomingAppointments.map((apt) => (
                                                    <article key={apt.id} className="appointment-featured" style={{ marginTop: "1rem" }}>
                                                        <div className="appointment-featured-image">
                                                            <div className="status-badge confirmed">Potvrđeno</div>
                                                        </div>

                                                        <div className="appointment-featured-content">
                                                            <h4 className="appointment-title">{apt.service}</h4>

                                                            <div className="appointment-meta">
                                                            <span className="appointment-date">
                                                            {formatDate(apt.date).full}
                                                            </span>
                                                            </div>

                                                            <div className="appointment-actions">
                                                                <button
                                                                    className="btn btn-outline"
                                                                    onClick={() => cancelAppointment(apt.id)}
                                                                >
                                                                    Otkaži
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </article>
                                                ))}
                                            </>
                                        ) : (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '4rem 2rem',
                                                background: 'white',
                                                borderRadius: '16px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                marginTop: '2rem'
                                            }}>
                                                <div style={{
                                                    fontSize: '4rem',
                                                    marginBottom: '1.5rem',
                                                    opacity: 0.3
                                                }}>
                                                    📅
                                                </div>
                                                <h3 style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: 600,
                                                    color: 'var(--graphite)',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    Nema nadolazećih termina
                                                </h3>
                                                <p style={{
                                                    color: 'var(--graphite)',
                                                    opacity: 0.7,
                                                    marginBottom: '2rem',
                                                    fontSize: '0.95rem'
                                                }}>
                                                    Rezerviraj svoj prvi termin i uživaj u našim uslugama
                                                </p>
                                                <button 
                                                    onClick={() => setShowBooking(true)}
                                                    className="btn btn-primary"
                                                    style={{
                                                        padding: '0.875rem 2rem',
                                                        fontSize: '1rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    + Rezerviraj termin
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {pastAppointments.length > 0 && (
                                        <div className="appointments-recent" style={{ marginTop: '2rem' }}>
                                            <h3 className="section-label">Prošli termini</h3>
                                            {pastAppointments.slice(0, 5).map((apt) => (
                                                <article key={apt.id} className="appointment-card">
                                                    <div className="appointment-date-box">
                                                        <span className="appointment-day">{formatDate(apt.date).day}</span>
                                                        <span className="appointment-month">{formatDate(apt.date).month}</span>
                                                    </div>
                                                    <div className="appointment-info">
                                                        <h4 className="appointment-title">{apt.service}</h4>
                                                        <span className="appointment-date">{formatDate(apt.date).full}</span>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "loyalty" && (
                            <div className="tab-panel loyalty-panel active">
                                <header className="panel-header">
                                    <h2 className="panel-title">Loyalty bodovi</h2>
                                    <p className="panel-subtitle">
                                        Vaša elegancija, nagrađena
                                    </p>
                                </header>

                                {/* Loyalty Overview */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number">{loyaltyData?.loyaltyPoints || 0}</span>
                                            <span className="points-label">Dostupnih bodova</span>
                                        </div>
                                    </div>

                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number" style={{ 
                                                color: getTierColor(loyaltyData?.loyaltyTier || "Bronze"),
                                                fontSize: "1.5rem"
                                            }}>
                                                {getTierName(loyaltyData?.loyaltyTier || "Bronze")}
                                            </span>
                                            <span className="points-label">Vaša razina</span>
                                        </div>
                                    </div>

                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number">{loyaltyData?.totalVisits || 0}</span>
                                            <span className="points-label">Ukupno posjeta</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Available Rewards */}
                                <div style={{ marginBottom: "2rem" }}>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", color: "#2b2b2b" }}>
                                        Dostupni kuponi
                                    </h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                                        {loyaltyRewards.map((reward) => (
                                            <div key={reward.id} style={{
                                                background: "white",
                                                borderRadius: "12px",
                                                padding: "1.5rem",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                                border: (loyaltyData?.loyaltyPoints || 0) >= reward.pointsCost ? "2px solid var(--gold)" : "1px solid #e0e0e0"
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                                                    <div>
                                                        <h4 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0, color: "#2b2b2b" }}>
                                                            {reward.name}
                                                        </h4>
                                                        <p style={{ fontSize: "0.875rem", color: "#6e6e6e", margin: "0.25rem 0 0 0" }}>
                                                            {reward.description}
                                                        </p>
                                                    </div>
                                                    {reward.discount && (
                                                        <span style={{
                                                            background: "var(--gold)",
                                                            color: "white",
                                                            padding: "0.25rem 0.75rem",
                                                            borderRadius: "6px",
                                                            fontSize: "0.875rem",
                                                            fontWeight: 600
                                                        }}>
                                                            -{reward.discount}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                                                    <span style={{ fontSize: "0.875rem", color: "#6e6e6e" }}>
                                                        {reward.pointsCost} bodova
                                                    </span>
                                                    <button
                                                        onClick={() => redeemReward(reward.id)}
                                                        disabled={(loyaltyData?.loyaltyPoints || 0) < reward.pointsCost || loyaltyLoading}
                                                        className="btn btn-primary btn-sm"
                                                        style={{
                                                            opacity: (loyaltyData?.loyaltyPoints || 0) < reward.pointsCost ? 0.5 : 1,
                                                            cursor: (loyaltyData?.loyaltyPoints || 0) < reward.pointsCost ? "not-allowed" : "pointer"
                                                        }}
                                                    >
                                                        Aktiviraj
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {loyaltyRewards.length === 0 && (
                                            <p style={{ color: "#6e6e6e", gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                                                Trenutno nema dostupnih kupona
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Transaction History */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                        <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, color: "#2b2b2b" }}>
                                            Povijest transakcija
                                        </h3>
                                        <button
                                            onClick={fetchLoyaltyTransactions}
                                            className="btn btn-outline btn-sm"
                                        >
                                            Osvježi
                                        </button>
                                    </div>
                                    <div style={{ 
                                        background: "white", 
                                        borderRadius: "12px", 
                                        padding: "1rem",
                                        maxHeight: "300px",
                                        overflowY: "auto"
                                    }}>
                                        {loyaltyTransactions.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                {loyaltyTransactions.map((transaction) => (
                                                    <div key={transaction.id} style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        padding: "0.75rem",
                                                        background: "#f9f9f9",
                                                        borderRadius: "8px"
                                                    }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontWeight: 500, color: "#2b2b2b" }}>
                                                                {transaction.description}
                                                            </p>
                                                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#6e6e6e" }}>
                                                                {new Date(transaction.createdAt).toLocaleDateString("hr-HR", {
                                                                    day: "numeric",
                                                                    month: "long",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                })}
                                                            </p>
                                                        </div>
                                                        <span style={{
                                                            fontWeight: 600,
                                                            color: transaction.points > 0 ? "#10b981" : "#ef4444",
                                                            fontSize: "1.1rem"
                                                        }}>
                                                            {transaction.points > 0 ? "+" : ""}{transaction.points}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: "#6e6e6e", textAlign: "center", padding: "2rem" }}>
                                                Nema transakcija. Klikni "Osvježi" za učitavanje.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'invite' && (
                            <div className="tab-panel invite-panel active">
                                <div className="invite-hero">
                                    <h2 className="invite-title">Pozovi prijatelje i zaradi</h2>
                                    <p className="invite-subtitle">
                                        Podijeli svoj invite code s prijateljima. Kada se netko registrira s tvojim kodom, dobiješ 15 loyalty bodova! 🎁
                                    </p>
                                    <div className="invite-code-section">
                                        {inviteCode ? (
                                            <>
                                                <div className="code-display">{inviteCode}</div>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => copyToClipboard(inviteCode)}
                                                >
                                                    📋 Kopiraj kod
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{ 
                                                textAlign: 'center', 
                                                padding: '2rem',
                                                color: 'var(--graphite)',
                                                opacity: 0.7
                                            }}>
                                                <p style={{ marginBottom: '1rem' }}>
                                                    Nemaš invite code. Generiraj novi kod i počni pozivati prijatelje!
                                                </p>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={generateUserInviteCode}
                                                >
                                                    ➕ Generiraj invite code
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="tab-panel profile-panel active" style={{ 
                                height: '100%', 
                                overflow: 'auto',
                                padding: '0',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <ProfileTab />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <BookAppointmentModal
                open={showBooking}
                onClose={() => setShowBooking(false)}
                onSuccess={() => {
                    fetchAppointments();
                }}
            />

        </div>
    );
}