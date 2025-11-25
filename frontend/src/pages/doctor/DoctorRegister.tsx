import styles from '../../styles/doctor/doctor-register.module.css'

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { DoctorRegisterMetadata } from '../../types/doctor.types';
import { useNavigate, Link } from 'react-router-dom';
import { PageLoader } from '../../components/ui';
import DoctorRegistrationFormService from '../../services/doctorRegistrationFormService';

function DoctorRegister() {
    const [metadata, setMetadata] = useState<DoctorRegisterMetadata>();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [errorCode, setErrorCode] = useState<number | null>(null);

    const [errors, setErrors] = useState<any>({});
    const [formData, setFormData] = useState<any>({});
    const [touched, setTouched] = useState<{
        licenseImage?: boolean,
        avatar?: boolean,
        degreeFiles?: boolean,
        identityCardImages?: boolean,
    }>({});

    // Separate state for date display value (DD/MM/YYYY format)
    const [dateOfBirthDisplay, setDateOfBirthDisplay] = useState('');

    // Helper function to format date to DD/MM/YYYY for display
    const formatDateForDisplay = (dateString: string): string => {
        if (!dateString) return '';
        
        // If already in YYYY-MM-DD format, convert to DD/MM/YYYY
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }
        
        // If already in DD/MM/YYYY format, return as is
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
            return dateString;
        }
        
        return dateString;
    };

    // Helper function to validate date values
    const validateDateValues = (day: string, month: string, year: string): { isValid: boolean; error?: string } => {
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        
        // Check year range (reasonable range: 1900 to current year)
        const currentYear = new Date().getFullYear();
        if (yearNum < 1900 || yearNum > currentYear) {
            return { isValid: false, error: `Năm phải từ 1900 đến ${currentYear}` };
        }
        
        // Check month range
        if (monthNum < 1 || monthNum > 12) {
            return { isValid: false, error: 'Tháng phải từ 1 đến 12' };
        }
        
        // Check day range based on month
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        if (dayNum < 1 || dayNum > daysInMonth) {
            return { isValid: false, error: `Ngày không hợp lệ. Tháng ${monthNum} có tối đa ${daysInMonth} ngày` };
        }
        
        // Check if the date is valid (e.g., not 29/02 on non-leap year)
        const date = new Date(yearNum, monthNum - 1, dayNum);
        if (date.getFullYear() !== yearNum || date.getMonth() !== monthNum - 1 || date.getDate() !== dayNum) {
            return { isValid: false, error: 'Ngày tháng năm không hợp lệ' };
        }
        
        return { isValid: true };
    };

    // Helper function to parse and format date input with validation
    const parseDateInput = (input: string): { date: string; error?: string } => {
        // If input is already in YYYY-MM-DD format, validate and return
        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            const [year, month, day] = input.split('-');
            const validation = validateDateValues(day, month, year);
            if (!validation.isValid) {
                return { date: input, error: validation.error };
            }
            return { date: input };
        }
        
        // Handle DD/MM/YYYY format
        const ddmmyyyyMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
            const [, day, month, year] = ddmmyyyyMatch;
            const validation = validateDateValues(day, month, year);
            if (!validation.isValid) {
                return { date: input, error: validation.error };
            }
            return { date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` };
        }
        
        // Handle DD-MM-YYYY format
        const ddmmyyyyDashMatch = input.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (ddmmyyyyDashMatch) {
            const [, day, month, year] = ddmmyyyyDashMatch;
            const validation = validateDateValues(day, month, year);
            if (!validation.isValid) {
                return { date: input, error: validation.error };
            }
            return { date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` };
        }
        
        // Handle DDMMYYYY format (8 digits)
        const ddmmyyyyNoSepMatch = input.match(/^(\d{2})(\d{2})(\d{4})$/);
        if (ddmmyyyyNoSepMatch) {
            const [, day, month, year] = ddmmyyyyNoSepMatch;
            const validation = validateDateValues(day, month, year);
            if (!validation.isValid) {
                return { date: input, error: validation.error };
            }
            return { date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` };
        }
        
        // If format doesn't match, check if it's incomplete (user still typing)
        if (input && !input.includes('/') && !input.includes('-') && input.length < 8) {
            // User is still typing, don't validate yet
            return { date: '' };
        }
        
        // Invalid format
        return { date: input, error: 'Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng: dd/mm/yyyy' };
    };

    // Helper function to format date input with mask DD/MM/YYYY
    const formatDateInput = (value: string): string => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        
        // Limit to 8 digits (DDMMYYYY)
        const limitedDigits = digits.slice(0, 8);
        
        // Format as DD/MM/YYYY
        if (limitedDigits.length <= 2) {
            return limitedDigits;
        } else if (limitedDigits.length <= 4) {
            return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2)}`;
        } else {
            return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2, 4)}/${limitedDigits.slice(4)}`;
        }
    };

    const navigate = useNavigate();

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const data = await DoctorRegistrationFormService.getMetadata();
                setMetadata(data);
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
                setErrorCode(500);
            } finally {
                setPageLoading(false);
            }
        }
        fetchMetadata();
    }, []);

    // Sync dateOfBirthDisplay when formData.dob changes from external source
    useEffect(() => {
        if (formData.dob && /^\d{4}-\d{2}-\d{2}$/.test(formData.dob) && !dateOfBirthDisplay) {
            // Only update if display is empty (to avoid overwriting user input)
            setDateOfBirthDisplay(formatDateForDisplay(formData.dob));
        } else if (!formData.dob && dateOfBirthDisplay) {
            // Clear display when dob is cleared
            setDateOfBirthDisplay('');
        }
    }, [formData.dob]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        const submitFormData = new FormData(form);

        // Override dob with the parsed YYYY-MM-DD format from formData state
        if (formData.dob) {
            submitFormData.set('dob', formData.dob);
        }

        for (const [key, value] of submitFormData.entries()) {
            console.log(`${key}:`, value);
        }
        console.log(submitFormData);

        const agreed = submitFormData.get('agreeToTerms') === 'on'; // checkbox returns 'on' if checked

        if (!agreed) {
            setErrors((prev: any) => ({
                ...prev, AgreeToTerms: 'Vui lòng đọc và đồng ý với điều khoản trước khi đăng ký'
            }));
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            await DoctorRegistrationFormService.registerDoctor(submitFormData);
            setLoading(false);
            console.log('Registration successful');
            Swal.fire({
                title: 'Đăng ký thành công!',
                text: 'Tài khoản của bạn đang chờ xác minh. Hệ thống sẽ tự động quay lại trang chủ.',
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = '/';
            });
        } catch (error: any) {
            setLoading(false);
            console.error('Registration failed:', error);

            const status = error?.response?.status;

            if (status === 400 || status === 422) {
                // Handle validation errors
                const errorData = error.response.data;
                setErrors(errorData.errors);
                console.log(errorData.errors);
            } else {
                // Fallback for other errors
                setErrors({ general: 'Đã xảy ra lỗi. Vui lòng thử lại.' });
            }
        }

    };

    const validateField = (name: string, value: string) => {
        const newErrors: Record<string, string[]> = {};

        switch (name) {
            case 'fullName':
                if (!value.trim()) {
                    newErrors.FullName = ['Vui lòng nhập họ và tên'];
                } else {
                    newErrors.FullName = [''];
                }
                break;

            case 'userName':
                const trimmed = value.trim();

                if (!trimmed) {
                    newErrors.UserName = ['Vui lòng nhập tên đăng nhập'];
                } else if (trimmed.length < 6) {
                    newErrors.UserName = ['Tên đăng nhập phải có ít nhất 6 ký tự'];
                } else if (trimmed.length > 20) {
                    newErrors.UserName = ['Tên đăng nhập không được vượt quá 20 ký tự'];
                } else if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
                    newErrors.UserName = ['Tên đăng nhập chỉ được chứa chữ cái và số, không có khoảng trắng hoặc ký tự đặc biệt'];
                } else {
                    newErrors.UserName = [];
                }
                break;

            case 'identificationNumber':
                if (!value.trim()) {
                    newErrors.IdentificationNumber = ['Vui lòng nhập số CCCD'];
                } else if (!/^\d{12}$/.test(value)) {
                    newErrors.IdentificationNumber = ['Số CCCD phải gồm đúng 12 chữ số'];
                } else {
                    newErrors.IdentificationNumber = [];
                }
                break;

            case 'email':
                if (!value.trim()) {
                    newErrors.Email = ['Vui lòng nhập email'];
                } else if (!/^\S+@\S+\.\S+$/.test(value)) {
                    newErrors.Email = ['Email không hợp lệ'];
                }
                else {
                    newErrors.Email = [];
                }
                break;

            case 'phoneNumber':
                if (!value.trim()) {
                    newErrors.PhoneNumber = ['Vui lòng nhập số điện thoại'];
                } else if (!/^0\d{9}$/.test(value)) {
                    newErrors.PhoneNumber = ['Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số'];
                } else {
                    newErrors.PhoneNumber = [];
                }
                break;

            case 'licenseNumber':
                if (!value.trim()) {
                    newErrors.LicenseNumber = ['Vui lòng nhập số giấy phép hành nghề'];
                } else {
                    newErrors.LicenseNumber = [];
                }
                break;

            case 'yearsOfExperience':
                const years = Number(value);
                if (!value.trim()) {
                    newErrors.YearsOfExperience = ['Vui lòng nhập số năm kinh nghiệm'];
                } else if (isNaN(years) || years < 1 || years > 50) {
                    newErrors.YearsOfExperience = ['Số năm kinh nghiệm không hợp lệ'];
                } else {
                    newErrors.YearsOfExperience = [];
                }
                break;

            case 'dob':
                if (!value) {
                    newErrors.Dob = ['Vui lòng nhập ngày sinh'];
                } else {
                    // Validate date format and values
                    const parsed = parseDateInput(value);
                    if (parsed.error) {
                        newErrors.Dob = [parsed.error];
                    } else if (parsed.date) {
                        // Check if date is valid YYYY-MM-DD format
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
                            newErrors.Dob = ['Ngày sinh không hợp lệ'];
                        } else {
                            const birthDate = new Date(parsed.date);
                            const currentDate = new Date();
                            const age = currentDate.getFullYear() - birthDate.getFullYear();
                            const monthDiff = currentDate.getMonth() - birthDate.getMonth();
                            const dayDiff = currentDate.getDate() - birthDate.getDate();
                            
                            // Calculate exact age
                            let exactAge = age;
                            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                                exactAge--;
                            }

                            if (isNaN(birthDate.getTime())) {
                                newErrors.Dob = ['Ngày sinh không hợp lệ'];
                            } else if (exactAge < 25) {
                                newErrors.Dob = ['Bạn phải đủ 25 tuổi để đăng ký'];
                            } else if (exactAge > 150) {
                                newErrors.Dob = ['Ngày sinh không hợp lệ'];
                            } else if (birthDate > currentDate) {
                                newErrors.Dob = ['Ngày sinh không thể là ngày trong tương lai'];
                            } else {
                                newErrors.Dob = [];
                            }
                        }
                    } else {
                        newErrors.Dob = ['Vui lòng nhập đầy đủ ngày sinh'];
                    }
                }
                break;

            case 'genderCode':
                if (!value) {
                    newErrors.GenderCode = ['Vui lòng chọn giới tính'];
                } else {
                    newErrors.GenderCode = [];
                }
                break;
        }

        setErrors((prev: any) => ({ ...prev, ...newErrors }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Special handling for date of birth field
        if (name === 'dob') {
            // Format the display value as DD/MM/YYYY while typing
            const formattedValue = formatDateInput(value);
            
            // Update display value immediately so user can see what they're typing
            setDateOfBirthDisplay(formattedValue);
            
            // Parse to YYYY-MM-DD format for storage with validation
            const parsed = parseDateInput(formattedValue);
            
            // Store the parsed date (YYYY-MM-DD) for backend, or empty if invalid/incomplete
            const dateToStore = parsed.date && !parsed.error ? parsed.date : '';
            setFormData((prev: any) => ({ ...prev, [name]: dateToStore }));
            
            // Validate with error message if any
            if (parsed.error) {
                setErrors((prev: any) => ({ 
                    ...prev, 
                    Dob: [parsed.error] 
                }));
            } else if (dateToStore) {
                // Validate the date - validateField will set errors if invalid
                validateField(name, dateToStore);
            } else if (formattedValue.length >= 10 && formattedValue.includes('/')) {
                // User has entered full format but it's invalid
                setErrors((prev: any) => ({ 
                    ...prev, 
                    Dob: ['Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng: dd/mm/yyyy'] 
                }));
            } else {
                // Clear error if user is still typing (less than 10 chars or incomplete)
                setErrors((prev: any) => {
                    const { Dob, ...rest } = prev;
                    return rest;
                });
            }
            return; // Early return for date processing
        }
        
        // For other fields
        setFormData((prev: any) => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        const name = e.target.name;

        setFormData((prev: any) => ({ ...prev, [name]: file }));

        switch (name) {
            case 'avatar':
                validateFile('Avatar', file, 'image');
                break;
            case 'licenseImage':
                validateFile('LicenseImage', file, 'image');
                break;
            case 'degreeFiles':
                validateFile('DegreeFiles', file, 'archive');
                break;
        }
    };

    const validateFile = (name: string, file: File | null, type: 'image' | 'archive') => {
        if (!file) {
            setErrors((prev: any) => ({
                ...prev,
                [name]: [`Vui lòng chọn một tệp.`],
            }));
            return;
        }

        const maxSizeInMB = 1; // 3MB in bytes
        const maxSize = maxSizeInMB * 1024 * 1024;

        if (file.size > maxSize) {
            setErrors((prev: any) => ({
                ...prev,
                [name]: [`Kích thước tệp không được vượt quá ${maxSizeInMB}MB.`],
            }))
        };

        const validArchiveExtensions = ['.zip', '.rar'];
        const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();


        switch (type) {
            case 'archive':
                if (!validArchiveExtensions.includes(fileExtension)) {
                    setErrors((prev: any) => ({
                        ...prev,
                        [name]: ['Tệp phải có định dạng ZIP hoặc RAR.'],
                    }));
                } else {
                    setErrors((prev: any) => ({
                        ...prev,
                        [name]: [''],
                    }));
                }
                break;
            case 'image':
                if (!validImageExtensions.includes(fileExtension)) {
                    setErrors((prev: any) => ({
                        ...prev,
                        [name]: ['Tệp phải là ảnh hợp lệ (jpg, png, gif, webp).'],
                    }));
                } else {
                    setErrors((prev: any) => ({
                        ...prev,
                        [name]: [''],
                    }));
                }
                break;
        }
    }

    const handleIdentityCardImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const name = "IdentityCardImages";

        setFormData((prev: any) => ({ ...prev, 'identityCardImages': files }));

        validateIdentityCardImages(files, name);
    }

    const validateIdentityCardImages = (
        files: FileList | null,
        name: string,
    ) => {
        // ✅ Must have exactly 2 files
        if (!files || files.length !== 2) {
            setErrors((prev: any) => ({
                ...prev,
                [name]: ["Bạn phải chọn đúng 2 ảnh (mặt trước và mặt sau)."],
            }));
            return;
        }

        const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        const maxSizeInMB = 1;
        const maxSize = maxSizeInMB * 1024 * 1024;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExtension = file.name
                .slice(file.name.lastIndexOf("."))
                .toLowerCase();

            // ✅ Check extension
            if (!validImageExtensions.includes(fileExtension)) {
                setErrors((prev: any) => ({
                    ...prev,
                    [name]: [`File ${file.name} không phải là ảnh hợp lệ.`],
                }));
                return;
            }

            // ✅ Check size
            if (file.size > maxSize) {
                setErrors((prev: any) => ({
                    ...prev,
                    [name]: [
                        `File ${file.name} vượt quá dung lượng cho phép (≤ ${maxSizeInMB}MB).`,
                    ],
                }));
                return;
            }
        }

        // ✅ Passed validation
        setErrors((prev: any) => ({
            ...prev,
            [name]: [""],
        }));
        return;
    };


    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Live validation
        if (!value) {
            setErrors((prev: any) => ({ ...prev, 'SpecializationId': ['Vui lòng chọn chuyên khoa'] }));
        } else {
            setErrors((prev: any) => ({ ...prev, 'SpecializationId': [''] }));
        }
    };

    const validateNumber = (input: string) => {
        // Remove any non-digit characters
        return input.replace(/[^0-9]/g, '');
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const { name, value } = e.target;
        const sanitized = validateNumber(raw);
        setFormData((prev: any) => ({ ...prev, [name]: sanitized }));
    };


    if (pageLoading) return <PageLoader />;

    if (errorCode) {
        navigate(`/error/${errorCode}`);
        return null;
    }

    return (
        <div>
            <main className={styles["main-container"]}>
                <div className={styles["form-container"]}>
                    <div className={styles["doctor-register-title-section"]}>
                        <h1 className={styles["register-title"]}>Đăng Ký Tài Khoản Bác Sĩ</h1>
                        <div className={styles["register-desc"]}>
                            Vui lòng điền đầy đủ thông tin để tạo tài khoản
                        </div>
                    </div>
                    <form id="registrationForm" encType='multipart/form-data' onSubmit={handleSubmit}>
                        {/* Row 1 */}
                        <div className={styles["form-row"]}>
                            {/* Left Column: Personal Info & Login */}
                            <div className={styles["form-section"]}>
                                <h2 className={styles["section-title"]}>Phần 1: Thông tin cá nhân &amp; đăng nhập</h2>
                                <div className={styles["form-group"]}>
                                    <label htmlFor="avatar" className={styles["form-label"]}>
                                        Ảnh thẻ <span className={styles["required"]}>*</span>
                                    </label>

                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="file"
                                            id="avatar"
                                            name="avatar"
                                            accept=".jpg,.png,.gif,.webp,.jpeg"
                                            onChange={handleFileChange}
                                            className={`d-none`} />

                                        <label
                                            htmlFor="avatar"
                                            className={`btn btn-outline-primary ${errors.Avatar?.[0]
                                                ? 'is-invalid'
                                                : touched.avatar && formData.avatar
                                                    ? 'is-valid'
                                                    : ''
                                                }`}>
                                            Chọn file
                                        </label>

                                        <span className="ms-2">
                                            {formData.avatar?.name || 'Chưa có file nào được chọn'}
                                        </span>
                                    </div>

                                    {errors.Avatar?.[0] && (
                                        <div className="text-danger">
                                            {errors.Avatar[0]}
                                        </div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Họ và tên <span className={styles["required"]}>*</span></label>
                                    <input
                                        type="text"
                                        className={`${styles["form-input"]} form-control ${errors.FullName?.[0]
                                            ? 'is-invalid'
                                            : formData.fullName?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        name="fullName"
                                        placeholder="Nguyễn Văn A" />
                                    {errors.FullName?.[0] && <div className="text-danger">{errors.FullName[0]}</div>}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Tên đăng nhập <span className={styles["required"]}>*</span></label>
                                    <input type="text"
                                        className={`${styles["form-input"]} form-control ${errors.UserName?.[0]
                                            ? 'is-invalid'
                                            : formData.userName?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            target.value = target.value.slice(0, 15); // force max 15 characters
                                        }}
                                        placeholder="drhao" name='userName' />
                                    {errors.UserName?.[0] && (
                                        <div className="text-danger">{errors.UserName[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Ngày sinh <span className={styles["required"]}>*</span></label>
                                    <input 
                                        type="text"
                                        className={`${styles["form-input"]} form-control ${errors.Dob?.[0]
                                            ? 'is-invalid'
                                            : formData.dob?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        placeholder="dd/mm/yyyy"
                                        name='dob'
                                        value={dateOfBirthDisplay}
                                        maxLength={10}
                                    />
                                    {errors.Dob?.[0] && (
                                        <div className="text-danger">{errors.Dob[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Giới tính <span className={styles["required"]}>*</span></label>
                                    <div className={styles["radio-group"]}>
                                        {["Male", "Female", "Other"].map((value) => (
                                            <div key={value} className={styles["radio-option"]}>
                                                <input
                                                    type="radio"
                                                    name="genderCode"
                                                    id={value.toLowerCase()}
                                                    value={value}
                                                    onChange={handleChange}
                                                />
                                                <label htmlFor={value.toLowerCase()}>
                                                    {value === "Male" ? "Nam" : value === "Female" ? "Nữ" : "Khác"}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.GenderCode?.[0] && (
                                        <div className="text-danger">{errors.GenderCode[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số CCCD <span className={styles["required"]}>*</span></label>
                                    <input type="text"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            if (target.value.length > 12) {
                                                target.value = target.value.slice(0, 12);
                                            }
                                        }}
                                        className={`${styles["form-input"]} form-control ${errors.IdentificationNumber?.[0]
                                            ? 'is-invalid'
                                            : formData.identificationNumber?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={(e) => { handleNumberChange(e); handleChange(e); }}
                                        placeholder="Nhập số căn cước công dân 12 số"
                                        name='identificationNumber'
                                        value={formData.identificationNumber} />
                                    {errors.IdentificationNumber?.[0] && (
                                        <div className="text-danger">{errors.IdentificationNumber[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label htmlFor="identityCardImages" className={styles["form-label"]}>
                                        Ảnh CCCD <span className={styles["required"]}>*</span>
                                    </label>

                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="file"
                                            id="identityCardImages"
                                            name="identityCardImages"
                                            accept=".jpg,.png,.gif,.webp,.jpeg"
                                            onChange={handleIdentityCardImagesChange}
                                            className={`d-none`}
                                            multiple />
                                        <label
                                            htmlFor="identityCardImages"
                                            className={`btn btn-outline-primary ${errors.IdentityCardImages?.[0]
                                                ? 'is-invalid'
                                                : touched.identityCardImages && formData.identityCardImages
                                                    ? 'is-valid'
                                                    : ''
                                                }`}>
                                            Chọn file
                                        </label>

                                        <span className="ms-2">
                                            {formData.identityCardImages && formData.identityCardImages.length > 0
                                                ? Array.from(formData.identityCardImages as File[]).map((file) => file.name).join(", ")
                                                : "Chưa có file nào được chọn"}
                                        </span>
                                    </div>

                                    {errors.IdentityCardImages?.[0] && (
                                        <div className="text-danger">
                                            {errors.IdentityCardImages[0]}
                                        </div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Email <span className={styles["required"]}>*</span></label>
                                    <input type="text" name='email'
                                        className={`${styles["form-input"]} form-control ${errors.Email?.[0]
                                            ? 'is-invalid'
                                            : formData.email?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        placeholder="Email@example.com" />
                                    {errors.Email?.[0] && (
                                        <div className="text-danger">{errors.Email[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số điện thoại <span className={styles["required"]}>*</span></label>
                                    <input type="text" name='phoneNumber'
                                        inputMode="numeric"
                                        pattern="\d*"
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            if (target.value.length > 10) {
                                                target.value = target.value.slice(0, 10);
                                            }
                                        }}
                                        className={`${styles["form-input"]} form-control ${errors.PhoneNumber?.[0]
                                            ? 'is-invalid'
                                            : formData.phoneNumber?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={(e) => {
                                            handleNumberChange(e);
                                            handleChange(e);
                                        }}
                                        value={formData.phoneNumber}
                                        placeholder="09xxxxxxxx" />
                                    {errors.PhoneNumber?.[0] && (
                                        <div className="text-danger">{errors.PhoneNumber[0]}</div>
                                    )}
                                </div>
                            </div>
                            {/* Right Column: Medical Info & Emergency Contact */}
                            <div className={styles["form-section"]}>
                                <h2 className={styles["section-title"]}>Phần 2: Thông tin bác sĩ</h2>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Chuyên khoa <span className={styles["required"]}>*</span></label>
                                    <select className={`${styles["form-select"]}`} name='specializationId'
                                        onChange={handleSelectChange}>
                                        <option value="">Chọn chuyên khoa</option>
                                        {metadata?.specializations.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                    {errors.SpecializationId?.[0] && (
                                        <div className="text-danger">{errors.SpecializationId[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số chứng chỉ <span className={styles["required"]}>*</span></label>
                                    <input type="text" name='licenseNumber'
                                        className={`${styles["form-input"]} form-control ${errors.LicenseNumber?.[0]
                                            ? 'is-invalid'
                                            : formData.licenseNumber?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange} />
                                    {errors.LicenseNumber?.[0] && (
                                        <div className="text-danger">{errors.LicenseNumber[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label htmlFor="licenseImage" className={styles["form-label"]}>
                                        Ảnh chứng chỉ <span className={styles["required"]}>*</span>
                                    </label>

                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="file"
                                            id="licenseImage"
                                            name="licenseImage"
                                            accept=".jpg,.png,.gif,.webp,.jpeg"
                                            onChange={handleFileChange}
                                            className={`d-none`} />

                                        <label
                                            htmlFor="licenseImage"
                                            className={`btn btn-outline-primary ${errors.LicenseImage?.[0]
                                                ? 'is-invalid'
                                                : touched.licenseImage && formData.licenseImage
                                                    ? 'is-valid'
                                                    : ''
                                                }`}>
                                            Chọn file
                                        </label>

                                        <span className="ms-2">
                                            {formData.licenseImage?.name || 'Chưa có file nào được chọn'}
                                        </span>
                                    </div>

                                    {errors.LicenseImage?.[0] && (
                                        <div className="text-danger">
                                            {errors.LicenseImage[0]}
                                        </div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label htmlFor="degreeFiles" className={styles["form-label"]}>
                                        Bằng cấp <span className={styles["required"]}>*</span>
                                    </label>

                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="file"
                                            id="degreeFiles"
                                            name="degreeFiles"
                                            accept=".zip,.rar"
                                            onChange={handleFileChange}
                                            className={`d-none`} />

                                        <label
                                            htmlFor="degreeFiles"
                                            className={`btn btn-outline-primary ${errors.DegreeFiles?.[0]
                                                ? 'is-invalid'
                                                : touched.degreeFiles && formData.degreeFiles
                                                    ? 'is-valid'
                                                    : ''
                                                }`}>
                                            Chọn file
                                        </label>

                                        <span className="ms-2">
                                            {formData.degreeFiles?.name || 'Chưa có file nào được chọn'}
                                        </span>
                                    </div>

                                    {errors.DegreeFiles?.[0] && (
                                        <div className="text-danger">
                                            {errors.DegreeFiles[0]}
                                        </div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Tiểu sử</label>
                                    <textarea className={styles["form-input"]} name='bio' defaultValue={""} />
                                    {errors.Bio?.[0] && (
                                        <div className="text-danger">{errors.Bio[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Trình độ học vấn</label>
                                    <textarea className={styles["form-input"]} name='education' defaultValue={""} />
                                    {errors.Education?.[0] && (
                                        <div className="text-danger">{errors.Education[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số năm kinh nghiệm <span className={styles["required"]}>*</span></label>
                                    <input type="text"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        className={`${styles["form-input"]} form-control ${errors.YearsOfExperience?.[0]
                                            ? 'is-invalid'
                                            : formData.yearsOfExperience?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={(e) => {
                                            handleNumberChange(e);
                                            handleChange(e);
                                        }}
                                        name='yearsOfExperience'
                                        value={formData.yearsOfExperience} />
                                    {errors.YearsOfExperience?.[0] && (
                                        <div className="text-danger">{errors.YearsOfExperience[0]}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Terms & Conditions */}
                        <div className={styles["terms-section"]}>
                            <div className={styles["checkbox-wrapper"]}>
                                <input type="checkbox" id="terms" name='agreeToTerms' />
                                <label htmlFor="terms" className={styles["terms-text"]}>
                                    Tôi đồng ý <Link to="/terms" target="_blank" className={styles["terms-link"]}>Điều khoản dịch vụ</Link> và <Link to="/privacy" target="_blank" className={styles["terms-link"]}>Chính sách bảo mật</Link> của MEDIX. Thông tin y tế của bạn được mã hóa
                                    và tuân thủ chuẩn bảo mật y tế.
                                </label>
                            </div>
                            {errors.AgreeToTerms?.[0] && <div className="text-danger">{errors.AgreeToTerms}</div>}
                        </div>
                        {/* Submit Button */}
                        <div className={styles["submit-section"]}>
                            {errors.general && <div className="text-danger">{errors.general}</div>}
                            <button type="submit" disabled={loading} className={styles["btn-submit"]}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'ĐĂNG KÝ TÀI KHOẢN'
                                )}
                            </button>
                            <div className={styles["login-link-section"]}>
                                Bạn đã có tài khoản? <a href="/login" className={styles["login-link"]}>Đăng nhập ngay</a>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
export default DoctorRegister;
