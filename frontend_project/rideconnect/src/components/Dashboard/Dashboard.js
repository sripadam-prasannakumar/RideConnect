import React from 'react';
import './Dashboard.css';
import mapImage from './map.png';

const Dashboard = () => {
    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <i className="fa-solid fa-car"></i>
                    </div>
                    <div className="logo-text">
                        <h1>Ride Connect</h1>
                        <p>CUSTOMER PORTAL</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className="active">
                            <i className="fa-solid fa-table-columns"></i>
                            <span>Dashboard</span>
                        </li>
                        <li>
                            <i className="fa-solid fa-calendar-check"></i>
                            <span>Bookings</span>
                        </li>
                        <li>
                            <i className="fa-solid fa-car-side"></i>
                            <span>Vehicles</span>
                        </li>
                        <li>
                            <i className="fa-solid fa-credit-card"></i>
                            <span>Payments</span>
                        </li>
                        <li>
                            <i className="fa-solid fa-user"></i>
                            <span>Profile</span>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-promo">
                    <p>Upgrade to Pro for 20% off all rides.</p>
                    <button className="upgrade-btn">Upgrade Now</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <div className="search-bar">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input type="text" placeholder="Search rides, destinations..." />
                    </div>

                    <div className="topbar-actions">
                        <div className="notification-bell">
                            <i className="fa-solid fa-bell"></i>
                            <span className="dot"></span>
                        </div>
                        <div className="user-profile">
                            <div className="profile-info">
                                <span className="user-name">Alex Johnson</span>
                                <span className="user-tier">GOLD MEMBER</span>
                            </div>
                            <img src="https://i.pravatar.cc/150?u=alex" alt="Profile" className="profile-img" />
                        </div>
                    </div>
                </header>

                <section className="dashboard-welcome">
                    <h1>Welcome back, Alex!</h1>
                    <p>Ready for your next journey? We've found 4 available drivers nearby.</p>
                </section>

                <div className="dashboard-grid">
                    {/* Left Column */}
                    <div className="grid-left">
                        <div className="stats-row">
                            <div className="stat-card">
                                <div className="stat-header">
                                    <div className="icon-box teal">
                                        <i className="fa-solid fa-paper-plane"></i>
                                    </div>
                                    <span className="badge green">+1 today</span>
                                </div>
                                <div className="stat-body">
                                    <p>Active Bookings</p>
                                    <h2>02</h2>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-header">
                                    <div className="icon-box teal">
                                        <i className="fa-solid fa-arrows-spin"></i>
                                    </div>
                                    <span className="badge teal">+12 this month</span>
                                </div>
                                <div className="stat-body">
                                    <p>Total Rides</p>
                                    <h2>148</h2>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-header">
                                    <div className="icon-box teal">
                                        <i className="fa-solid fa-award"></i>
                                    </div>
                                    <span className="badge blue">Next tier at 3,000</span>
                                </div>
                                <div className="stat-body">
                                    <p>Loyalty Points</p>
                                    <h2>2,450</h2>
                                </div>
                            </div>
                        </div>

                        <div className="booking-form-card">
                            <h3>Book a Driver</h3>
                            <div className="form-inputs">
                                <div className="input-group">
                                    <label>PICKUP LOCATION</label>
                                    <div className="input-with-icon">
                                        <i className="fa-solid fa-location-dot"></i>
                                        <input type="text" placeholder="123 Neon District, Cyber City" />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>DESTINATION</label>
                                    <div className="input-with-icon">
                                        <i className="fa-solid fa-flag"></i>
                                        <input type="text" placeholder="Where to?" />
                                    </div>
                                </div>
                            </div>

                            <div className="vehicle-selection">
                                <p>SELECT VEHICLE TYPE</p>
                                <div className="vehicle-options">
                                    <div className="vehicle-opt active">
                                        <i className="fa-solid fa-car"></i>
                                        <span>Bolt</span>
                                    </div>
                                    <div className="vehicle-opt">
                                        <i className="fa-solid fa-car-side"></i>
                                        <span>Prime</span>
                                    </div>
                                    <div className="vehicle-opt">
                                        <i className="fa-solid fa-van-shuttle"></i>
                                        <span>Van</span>
                                    </div>
                                    <div className="vehicle-opt">
                                        <i className="fa-solid fa-motorcycle"></i>
                                        <span>Moto</span>
                                    </div>
                                </div>
                            </div>

                            <button className="confirm-btn">Confirm Booking • ₹24.50</button>
                        </div>

                        <div className="history-card">
                            <div className="history-header">
                                <h3>Booking History</h3>
                                <a href="#!">View All</a>
                            </div>
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>DRIVER</th>
                                        <th>ROUTE</th>
                                        <th>DATE</th>
                                        <th>PRICE</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div className="driver-cell">
                                                <img src="https://i.pravatar.cc/150?u=marcus" alt="Driver" />
                                                <span>Marcus</span>
                                            </div>
                                        </td>
                                        <td>Neon St → ...</td>
                                        <td>Oct 24, 10:30</td>
                                        <td>₹18.20</td>
                                        <td><span className="status-badge complete">Completed</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column (Map) */}
                    <div className="grid-right">
                        <div className="map-card">
                            <div className="map-header">
                                <h3>Live Traffic & Drivers</h3>
                                <span className="map-status">
                                    <span className="online-dot"></span>
                                    4 Drivers available nearby
                                </span>
                            </div>
                            <div className="map-container">
                                <img src={mapImage} alt="Map" className="map-view" />
                                <div className="map-overlay">
                                    <div className="driver-marker driver-1">
                                        <i className="fa-solid fa-car"></i>
                                    </div>
                                    <div className="driver-marker driver-2">
                                        <i className="fa-solid fa-car"></i>
                                    </div>
                                </div>
                                <button className="map-zoom-btn">
                                    <i className="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
