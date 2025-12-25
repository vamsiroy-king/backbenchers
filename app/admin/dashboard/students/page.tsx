"use client";

import { Users, Search, GraduationCap, MapPin, Loader2, Building2, Ban, Check, Eye, Download, Mail, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { studentService } from "@/lib/services/student.service";
import { universityService, University } from "@/lib/services/university.service";
import { Student } from "@/lib/types";
import { INDIAN_STATES, getCitiesForState } from "@/lib/data/locations";

export default function StudentsListPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'suspended'>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedState, setSelectedState] = useState("All States");
    const [selectedCity, setSelectedCity] = useState("All Cities");
    const [selectedUniversity, setSelectedUniversity] = useState("All Universities");
    const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, suspended: 0 });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [availableUniversities, setAvailableUniversities] = useState<University[]>([]);

    useEffect(() => {
        async function fetchStudents() {
            setLoading(true);
            try {
                const result = await studentService.getAll({
                    status: filter === 'all' ? undefined : filter,
                    state: selectedState === 'All States' ? undefined : selectedState,
                    city: selectedCity === 'All Cities' ? undefined : selectedCity,
                    college: selectedUniversity === 'All Universities' ? undefined : selectedUniversity,
                    search: searchQuery || undefined
                });

                if (result.success && result.data) {
                    setStudents(result.data);
                }

                const statsData = await studentService.getStats();
                setStats(statsData);
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStudents();
    }, [filter, searchQuery, selectedState, selectedCity, selectedUniversity]);

    useEffect(() => {
        if (selectedState === "All States") {
            setAvailableCities([]);
        } else {
            const cities = getCitiesForState(selectedState);
            setAvailableCities(cities);
        }
        setSelectedCity("All Cities");
    }, [selectedState]);

    useEffect(() => {
        async function fetchUniversities() {
            if (selectedCity === "All Cities") {
                setAvailableUniversities([]);
                return;
            }
            const universities = await universityService.getByCity(selectedCity);
            setAvailableUniversities(universities);
        }
        fetchUniversities();
        setSelectedUniversity("All Universities");
    }, [selectedCity]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.id));
        }
    };

    const handleSuspend = async (id: string) => {
        setActionLoading(id);
        const result = await studentService.updateStatus(id, 'suspended');
        if (result.success) {
            setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'suspended' } : s));
            // Update stats
            setStats(prev => ({
                ...prev,
                suspended: prev.suspended + 1,
                verified: Math.max(0, prev.verified - 1)
            }));
        }
        setActionLoading(null);
    };

    const handleUnsuspend = async (id: string) => {
        setActionLoading(id);
        const result = await studentService.updateStatus(id, 'verified');
        if (result.success) {
            setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'verified' } : s));
            // Update stats
            setStats(prev => ({
                ...prev,
                suspended: Math.max(0, prev.suspended - 1),
                verified: prev.verified + 1
            }));
        }
        setActionLoading(null);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete ${name}? This will also delete all their transactions and data. This cannot be undone.`)) {
            return;
        }

        setActionLoading(id);
        const result = await studentService.delete(id);
        if (result.success) {
            // Remove from local state immediately
            setStudents(prev => prev.filter(s => s.id !== id));
            // Update stats
            setStats(prev => ({
                ...prev,
                total: Math.max(0, prev.total - 1),
                verified: Math.max(0, prev.verified - 1)
            }));
        } else {
            alert('Failed to delete student: ' + result.error);
        }
        setActionLoading(null);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="h-7 w-7 text-blue-500" />
                        Students
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all student accounts and verifications</p>
                </div>
                <button className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium flex items-center gap-2 transition-colors">
                    <Download className="h-4 w-4" /> Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-100' },
                    { label: 'Verified', value: stats.verified, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Suspended', value: stats.suspended, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, BB-ID, email, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-12 pr-4 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="suspended">Suspended</option>
                    </select>

                    {/* State Filter */}
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium outline-none"
                    >
                        <option>All States</option>
                        {INDIAN_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>

                    {/* City Filter */}
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium outline-none"
                        disabled={availableCities.length === 0}
                    >
                        <option>All Cities</option>
                        {availableCities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>

                    {/* University Filter */}
                    <select
                        value={selectedUniversity}
                        onChange={(e) => setSelectedUniversity(e.target.value)}
                        className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium outline-none"
                        disabled={availableUniversities.length === 0}
                    >
                        <option>All Universities</option>
                        {availableUniversities.map(uni => (
                            <option key={uni.id} value={uni.name}>{uni.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 rounded-xl p-4 flex items-center justify-between"
                >
                    <span className="text-sm font-medium text-blue-700">
                        {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button className="h-9 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Send Email
                        </button>
                        <button className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                            <Ban className="h-4 w-4" /> Suspend All
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="h-9 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="w-12 px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === students.length && students.length > 0}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">BB-ID</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">College Email</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">College</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(student.id)}
                                            onChange={() => toggleSelect(student.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                {student.name?.charAt(0)?.toUpperCase() || 'S'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{student.name}</p>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-sm text-gray-600">{student.bbId || '-'}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-blue-600">{student.collegeEmail || '-'}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-600">{student.college || '-'}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-600">
                                            {student.city ? `${student.city}, ${student.state}` : '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${student.status === 'suspended'
                                            ? 'bg-red-100 text-red-700'
                                            : student.status === 'verified'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {student.status === 'suspended' ? <Ban className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                            {student.status?.charAt(0).toUpperCase() + student.status?.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/dashboard/students/${student.id}`}>
                                                <button className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </Link>
                                            {student.status !== 'suspended' ? (
                                                <button
                                                    onClick={() => handleSuspend(student.id)}
                                                    disabled={actionLoading === student.id}
                                                    className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center hover:bg-yellow-200 transition-colors disabled:opacity-50"
                                                    title="Suspend"
                                                >
                                                    {actionLoading === student.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                                                    ) : (
                                                        <Ban className="h-4 w-4 text-yellow-600" />
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnsuspend(student.id)}
                                                    disabled={actionLoading === student.id}
                                                    className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-50"
                                                    title="Reinstate"
                                                >
                                                    <Check className="h-4 w-4 text-green-600" />
                                                </button>
                                            )}
                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDelete(student.id, student.name || 'this student')}
                                                disabled={actionLoading === student.id}
                                                className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-50"
                                                title="Delete permanently"
                                            >
                                                {actionLoading === student.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && students.length === 0 && (
                    <div className="py-20 text-center">
                        <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No students found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
