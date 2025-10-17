import { useParams } from "react-router-dom";

import '../../styles/doctor-profile.css'
import { useEffect, useState } from "react";
import doctorService from "../../services/doctorService";
import { DoctorProfileDto } from "../../types/doctor.types";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

function DoctorProfile() {
    const [profileData, setProfileData] = useState<DoctorProfileDto>();
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const { username } = useParams();

    const BioTab = () => <p>{profileData?.biography}</p>
    const RatingTab = () =>
        <div>
            <div className="overview-header">
                <h3 className="overview-title">Tổng quan:</h3>
                <div className="overall-rating">
                    <span className="stars">
                        {'★'.repeat(Math.round(profileData?.averageRating ?? 0)) +
                            '☆'.repeat(5 - Math.round(profileData?.averageRating ?? 0))}
                    </span>
                    <span className="rating-number">{profileData?.averageRating}/5</span>
                </div>
            </div>
            <h4 className="rating-breakdown-title">Chi tiết lượt đánh giá</h4>
            <div className="rating-bar-group">
                {profileData?.ratingByStar && (
                    <div className="rating-bar-group">
                        {profileData.ratingByStar.map((count: number, index: number) => {
                            const star = index + 1;
                            const totalRatings = profileData.ratingByStar.reduce((sum, c) => sum + c, 0);
                            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                            return (
                                <div className="rating-bar-item" key={star}>
                                    <span className="rating-label">{star} ★</span>
                                    <div className="rating-bar-container">
                                        <div
                                            className="rating-bar-fill"
                                            style={{ width: `${percentage.toFixed(1)}%` }}
                                        />
                                    </div>
                                    <span className="rating-count-text">({count}) Đánh giá</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="reviews-section">
                <h4 className="reviews-title">Nhận xét về bác sĩ</h4>
                {profileData?.reviews.map((review) => (
                    <div className="review-item">
                        <div className="review-header">
                            <span className="review-stars">
                                {'★'.repeat(Math.round(review.rating)) +
                                    '☆'.repeat(5 - Math.round(review.rating))}
                            </span>
                            <span className="review-date">{review.date}</span>
                        </div>
                        <p className="review-text">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>

    const tabContents = [<BioTab />, <RatingTab />];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await doctorService.getDoctorProfile(username);
                setProfileData(data);
                console.log(data);
            } catch (error) {
                console.error('Failed to fetch profile data:', error);
            }
        }
        fetchProfile();
    }, []);

    return (
        <div>
            <Header />
            <div className="breadcrumb">
                <a href="#">Trang chủ</a> / <a href="#">Bác sĩ</a> / <span>Chi Tiết Bác Sĩ</span>
            </div>
            {/* Main Content */}
            <div className="container">
                <h1 className="page-title">Chi Tiết Bác Sĩ</h1>
                {/* Doctor Profile */}
                <div className="doctor-profile">
                    <img className="doctor-image" src={profileData?.avatarUrl} />
                    <div className="doctor-info">
                        <h3>Bác sĩ</h3>
                        <h2 className="doctor-name">{profileData?.fullName}</h2>
                        <div className="rating-section">
                            <span className="stars">
                                {'★'.repeat(Math.round(profileData?.averageRating ?? 0)) +
                                    '☆'.repeat(5 - Math.round(profileData?.averageRating ?? 0))}
                            </span>
                            <span className="rating-number">{profileData?.averageRating}/5</span>
                            <span className="rating-count">({profileData?.numberOfReviews} khách hàng đánh giá)</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Chuyên khoa:</span>
                            <span className="info-value">{profileData?.specialization}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Nơi công tác:</span>
                            <span className="info-value">Bệnh viện đại học y Hà Nội</span>
                        </div>
                    </div>
                </div>

                <div className="tabs">
                    <div className="tab-buttons">
                        {['Giới thiệu', 'Đánh giá'].map((label, i) => {
                            return <button
                                key={i}
                                className={`tab-btn ${activeTabIndex === i ? 'active' : ''}`}
                                onClick={() => setActiveTabIndex(i)}>
                                {label}
                            </button>
                        })}
                    </div>
                    <div className="tab-content">
                        {tabContents[activeTabIndex]}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default DoctorProfile;